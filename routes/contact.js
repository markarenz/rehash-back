exports.processContact = async (req, res, next) => {
    const email = req.body.email;
    const topic = req.body.topic;
    const question = req.body.question;
    const to = process.env.ADMIN_EMAIL;
    const subject = "Re:hash Contact Form";
    const text = `
        Who is this?: ${email} 
        Topic: ${topic}
        Question: ${question}
    `;
    const html = `
        <b>Who is this?:</b> ${email} <br />
        <br />
        <b>Topic:</b> ${topic} <br />
        <br />
        <b>Question:</b> ${question} <br />
        <br />
    `;
    // send email
    const send = require('gmail-send')({
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
        to,
        subject,
    });

    send({
        text,
        html,
    }, (error, result, fullResult) => {
        if (error) console.error(error);
        console.log(result);
    })

    res.send({success: true});
};
