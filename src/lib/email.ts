import { Resend } from 'resend'
import { env } from '@/lib/env'
import { emailConfig } from '@/lib/site'

function getResendClient() {
	return new Resend(env.RESEND_API_KEY)
}

export interface SendEmailOptions {
	to: string | string[]
	subject: string
	html: string
	from?: string
	replyTo?: string
	cc?: string | string[]
	bcc?: string | string[]
}

function sanitize(value: string) {
	return value.replace(/[\r\n]+/g, ' ').trim()
}

function uniqueList(value: string | string[] | undefined): string[] {
	if (!value) return []
	return Array.from(
		new Set((Array.isArray(value) ? value : [value]).map((v) => sanitize(String(v))).filter(Boolean)),
	)
}

class ResendService {
	private fromEmail = emailConfig.fromAddress

	async sendEmail(options: SendEmailOptions) {
		try {
			const resend = getResendClient()
			const from = sanitize(options.from || this.fromEmail)
			const toList = uniqueList(options.to)
			if (!from || toList.length === 0) throw new Error('from and to are required')
			const to = Array.isArray(options.to) ? toList : toList[0]!
			const subject = sanitize(options.subject)
			const replyTo = sanitize(options.replyTo || emailConfig.replyToAddress || '')
			const bcc = uniqueList([this.fromEmail, ...(options.bcc ? [options.bcc].flat() : [])])

			const result = await resend.emails.send({
				from,
				to,
				subject,
				html: options.html,
				replyTo: replyTo || undefined,
				cc: uniqueList(options.cc).length ? uniqueList(options.cc) : undefined,
				bcc: bcc.length ? bcc : undefined,
			})

			if (!result?.data?.id) throw new Error('No ID returned from Resend')
			return { success: true, data: result.data, id: result.data.id }
		} catch (error) {
			console.error('[Resend] Failed to send email:', error)
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to send email',
			}
		}
	}
}

export const resendService = new ResendService()
