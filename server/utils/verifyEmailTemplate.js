const verifyEmailTemplate = ({ name, url }) => {
    return `
        <p>Dear ${name}</p>
        <p>Thank you for registering TakSHOP.</p>
        <a href="${url}" style="color: #000; background: orange; margin-top: 10px; padding: 16px; display: block">
            Verify Email
        </a>
    `
}

export default verifyEmailTemplate