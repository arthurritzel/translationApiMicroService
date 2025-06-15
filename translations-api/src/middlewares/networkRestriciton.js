export const restrictToConsumer = (req, res, next) => {
  const allowedIPs = [
    '127.0.0.1',           // localhost
    '::1',                 // localhost IPv6
    '172.18.0.0/16',       // Rede Docker padrão
    '172.19.0.0/16',       // Rede Docker padrão
    '172.20.0.0/16',       // Rede Docker padrão
    '10.0.0.0/8',          // Redes privadas
    '192.168.0.0/16'       // Redes privadas
  ];

  const clientIP = req.ip || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null);

  const userAgent = req.get('User-Agent') || '';
  const host = req.get('Host') || '';

  console.log(`[NETWORK_CHECK] IP: ${clientIP}, User-Agent: ${userAgent}, Host: ${host}`);
  console.log(userAgent)
  console.log(host)
  
  // Verificar se é um container consumer baseado no User-Agent
  if (userAgent.includes('node')) {
    console.log('[NETWORK_CHECK] ✅ Access granted - Consumer container detected');
    return next();
  }

  // Verificar IP
  if (isIPAllowed(clientIP, allowedIPs)) {
    console.log('[NETWORK_CHECK] ✅ Access granted - IP allowed');
    return next();
  }

  // Bloquear acesso
  console.log(`[NETWORK_CHECK] ❌ Access denied for IP: ${clientIP}`);
  return res.status(403).json({
    error: 'Forbidden',
    message: 'Access denied - This endpoint is restricted to internal services',
    timestamp: new Date().toISOString()
  });
};

function isIPAllowed(ip, allowedIPs) {
  if (!ip) return false;

  // Limpar prefixos IPv6-mapped
  const cleanIP = ip.replace(/^::ffff:/, '');

  for (const allowedIP of allowedIPs) {
    if (allowedIP.includes('/')) {
      // CIDR notation
      if (isIPInCIDR(cleanIP, allowedIP)) {
        return true;
      }
    } else {
      // IP exato
      if (cleanIP === allowedIP) {
        return true;
      }
    }
  }

  return false;
}

function isIPInCIDR(ip, cidr) {
  try {
    const [network, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);
    
    return (ipToNumber(ip) & mask) === (ipToNumber(network) & mask);
  } catch (error) {
    console.error('Error checking CIDR:', error);
    return false;
  }
}

function ipToNumber(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}