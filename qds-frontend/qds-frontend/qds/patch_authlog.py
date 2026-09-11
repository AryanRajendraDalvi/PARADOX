import re

with open('src/auth/AuthContext.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

fallback_old = """  } catch (networkErr) {
    // No server process reachable at API_URL at all (connection refused,
    // DNS failure, CORS preflight failure, etc.) ?" fall back to the
    // labeled dev mock so the app is still usable during development.
    return mockLogin(username, password);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // Something answered at that address but isn't the session server
    // (e.g. a dev server's SPA-fallback HTML) ?" treat as "no real backend".
    return mockLogin(username, password);
  }"""

fallback_new = """  } catch (networkErr) {
    console.error("Network error hitting auth:", networkErr);
    // No server process reachable at API_URL at all (connection refused,
    // DNS failure, CORS preflight failure, etc.) ?" fall back to the
    // labeled dev mock so the app is still usable during development.
    return mockLogin(username, password);
  }

  const contentType = res.headers.get('content-type') || '';
  console.log("Auth hit success, content type:", contentType);
  if (!contentType.includes('application/json')) {
    console.warn("Falling back to mock due to content type");
    // Something answered at that address but isn't the session server
    // (e.g. a dev server's SPA-fallback HTML) ?" treat as "no real backend".
    return mockLogin(username, password);
  }"""

text = text.replace(fallback_old, fallback_new)

with open('src/auth/AuthContext.jsx', 'w', encoding='utf-8') as f:
    f.write(text)