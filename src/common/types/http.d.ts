import 'fastify'

interface AuthPrincipal {
  id: string
  email: string
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthPrincipal
  }
}

declare module 'http' {
  interface IncomingMessage {
    user?: AuthPrincipal
  }
}
