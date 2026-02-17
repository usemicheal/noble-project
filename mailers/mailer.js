import { resend } from './resendClient.js';

const mailer_sender =
	process.env.NODE_ENV === 'development'
		? `no-reply <onboarding@resend.dev>`
		: `no-reply <${process.env.MAILER_SENDER}>`;

export const sendEmail = async ({ to, from = mailer_sender, subject, text, html }) => {
	return await resend.emails.send({
		from,
		to: Array.isArray(to) ? to : to,
		text,
		subject,
		html,
	});
};
