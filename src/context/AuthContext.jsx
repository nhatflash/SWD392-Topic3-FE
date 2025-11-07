import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getAccessToken, clearTokens, getProfile, refresh as refreshTokenAPI, getRefreshToken } from '../services/auth';

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    // If decoding fails, return null (token missing or malformed)
    console.warn('parseJwt failed', e);
    return null;
  }
}

function isTokenExpired(token) {
  try {
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return true;
    // Token is considered expired if it expires in less than 10 seconds
    return Date.now() >= (payload.exp * 1000 - 10000);
  } catch {
    return true;
  }
}

function shouldRefreshToken(token) {
  try {
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return false;
    // Refresh if token expires in less than 2 minutes (120000 ms)
    // BE access token = 15 min, so we refresh at ~13 min mark
    return Date.now() >= (payload.exp * 1000 - 120000);
  } catch {
    return false;
  }
}

function userFromTokenPayload(payload) {
  if (!payload) return null;
  
  const username = payload.username || payload.sub || payload.email || payload.name || null;
  
  
  const extractRoles = (p) => {
    if (!p) return [];
    let vals = [];
    if (p.role) vals = Array.isArray(p.role) ? p.role : [p.role];
    else if (p.roles) vals = Array.isArray(p.roles) ? p.roles : [p.roles];
    else if (p.authorities) vals = Array.isArray(p.authorities) ? p.authorities : [p.authorities];
  
    vals = vals.map(v => {
      if (!v) return null;
      if (typeof v === 'string') return v;
      if (typeof v === 'object') return v.authority || v.role || v.name || JSON.stringify(v);
      return String(v);
    }).filter(Boolean);
  
    return vals.map(s => s.replace(/^ROLE_/, '').toUpperCase());
  };

  const roles = extractRoles(payload);
  const role = roles.length ? roles[0] : null;

  return { username, role, roles, raw: payload };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(!!getAccessToken());

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      // Check if token is expired
      if (isTokenExpired(token)) {
        console.warn('Access token expired on mount, logging out');
        clearTokens();
        setUser(null);
        setIsAuthenticated(false);
        try { localStorage.removeItem('user'); } catch {}
        return;
      }

      const payload = parseJwt(token);
      const derived = userFromTokenPayload(payload);
      if (derived) {
        (async () => {
          try {
            const profile = await getProfile();
            if (profile) {
              setUser(profile);
              try { localStorage.setItem('user', JSON.stringify(profile)); } catch (e) { console.warn('localStorage.setItem failed', e); }
            } else {
              setUser(derived);
              try { localStorage.setItem('user', JSON.stringify(derived)); } catch (e) { console.warn('localStorage.setItem failed', e); }
            }
          } catch (e) {
            // Failed to fetch profile; keep derived user
            console.warn('getProfile failed', e);
            setUser(derived);
            try { localStorage.setItem('user', JSON.stringify(derived)); } catch (e) { console.warn('localStorage.setItem failed', e); }
          }
        })();
        setIsAuthenticated(true);
      }
    } else {
      // No token - user is not logged in, this is normal for public pages
      setUser(null);
      setIsAuthenticated(false);
      // Don't show any error - user just hasn't logged in yet
    }

    // Setup interval to check token expiry and proactively refresh
    // Check every 30 seconds (BE access token = 15 min, we refresh at ~13 min)
    const interval = setInterval(async () => {
      const currentToken = getAccessToken();
      const currentRefreshToken = getRefreshToken();
      
      console.log('🔍 [Token Check] Checking token status...');
      
      if (!currentToken) {
        // No access token, clear everything
        console.warn('⚠️ [Token Check] No access token found, logging out');
        clearTokens();
        setUser(null);
        setIsAuthenticated(false);
        try { localStorage.removeItem('user'); } catch {}
        return;
      }

      // If access token is expired, logout
      if (isTokenExpired(currentToken)) {
        console.warn('⏰ [Token Check] Access token EXPIRED, logging out');
        clearTokens();
        setUser(null);
        setIsAuthenticated(false);
        try { localStorage.removeItem('user'); } catch {}
        return;
      }

      // Proactively refresh if token is close to expiry (< 2 minutes left)
      // BE access token = 15 min, refresh at ~13 min to avoid disruption
      if (shouldRefreshToken(currentToken) && currentRefreshToken) {
        try {
          await refreshTokenAPI(currentRefreshToken);
        } catch (e) {
          console.error('❌ [Token Refresh] FAILED, logging out:', e?.message);
          clearTokens();
          setUser(null);
          setIsAuthenticated(false);
          try { localStorage.removeItem('user'); } catch {}
        }
      } else {
        console.log('✓ [Token Check] Token is valid, no refresh needed');
      }
    }, 30000); // Check every 30 seconds

    // Listen for storage changes (cross-tab logout detection)
    const handleStorageChange = (e) => {
      // If tokens are cleared in another tab, logout in this tab too
      if (e.key === 'accessToken' && e.newValue === null) {
        console.warn('🚪 Detected logout in another tab, logging out...');
        setUser(null);
        setIsAuthenticated(false);
        try { localStorage.removeItem('user'); } catch {}
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = (userProfile, tokens) => {
  
    if (userProfile) {
      setUser(userProfile);
      try { localStorage.setItem('user', JSON.stringify(userProfile)); } catch {}
    } else if (tokens?.accessToken) {
      const payload = parseJwt(tokens.accessToken);
      const derived = userFromTokenPayload(payload);
      if (derived) {
  
        setUser(derived);
        try { localStorage.setItem('user', JSON.stringify(derived)); } catch {}
  
        (async () => {
          try {
            const profile = await getProfile();
            if (profile) {
              setUser(profile);
              try { localStorage.setItem('user', JSON.stringify(profile)); } catch (e) { console.warn('localStorage.setItem failed', e); }
            }
          } catch (e) {
            console.warn('getProfile failed', e);
          }
        })();
      }
    }

  
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
  try { localStorage.removeItem('user'); } catch (e) { console.warn('localStorage.removeItem failed', e); }
    clearTokens();
    setIsAuthenticated(false);
  };

  const hasRole = (role) => {
    if (!user) return false;
    if (!role) return false;
    const wanted = role.replace(/^ROLE_/, '').toUpperCase();
    if (user.roles && Array.isArray(user.roles)) return user.roles.includes(wanted);
    return user.role === wanted;
  };
  const providerValue = useMemo(() => ({ user, setUser, isAuthenticated, login, logout, hasRole }), [user, isAuthenticated]);

  return (
    <AuthContext.Provider value={providerValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;

AuthProvider.propTypes = {
  children: PropTypes.node,
};
