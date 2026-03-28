import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { magicLink } from 'better-auth/plugins'
import { Resend } from 'resend'
import { db } from './db'
import { user, session, account, verification } from './db/schema'

const resend = new Resend(process.env.RESEND_API_KEY)

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await resend.emails.send({
          from: 'Conlang <noreply@mail.conlang.app>',
          to: email,
          subject: 'Sign in to Conlang',
          html: `
            <div style="font-family: sans-serif; max-width: 480px;">
              <h2>Sign in to Conlang</h2>
              <p>Click the button below to sign in. This link expires in 15 minutes.</p>
              <a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Sign in</a>
              <p style="color:#666;font-size:13px;margin-top:16px;">Or copy this URL: ${url}</p>
            </div>
          `,
        })
      },
    }),
  ],
})
