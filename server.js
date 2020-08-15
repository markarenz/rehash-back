require("dotenv").config();
const express = require("express");
const graphqlHTTP = require("express-graphql");
const mongoose = require("mongoose");
const cors = require("cors");
// var bodyParser = require('body-parser');
const schema = require("./schema/schema");
const resolvers = require("./schema/resolvers");
const avatarUpload = require('./routes/avatarUpload');
const contact = require('./routes/contact');
const fileUpload = require('express-fileupload');
const { ApolloServer } = require('apollo-server-express');
const isTokenValid = require("./authValidate");
const jwt = require("jsonwebtoken");

const context = async req => {
    const { authorization: token } = req.headers;
    return { token };
};

const app = express();
app.use(fileUpload());

// enable CORS
app.use(cors());

mongoose
    .connect(
        'mongodb+srv://' + process.env.DB_ATLAS_MONGO_USER + ':' + process.env.DB_ATLAS_MONGO_PW + process.env.DB_ATLAS_MONGO_SERVER + '/ReHash?retryWrites=true&w=majority',
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
        }
    )
    .then(() => {
        console.log("MongoDB Atlas connected.");
    })
    .catch(err => {
        console.log("Unable to connect.");
        console.error(err);
    });

app.use('/avatar', avatarUpload.processAvatarUpload);
app.use('/contact', contact.processContact);


// app.use(
//     '/api',
//     cors(),
//     graphqlHTTP(async req => ({
//         schema,
//         rootValue: resolvers,
//         context: () => context(req),
//         graphiql: true,
//     })),
// );

const server = new ApolloServer({
    debug: true,
    typeDefs: schema,
    resolvers,
    engine: {
        debugPrintReports: true,
    },
    context: async ({ req }) => {
        const token = req.headers.authorization || '';
        const { error, decoded } = await isTokenValid(token);
        const tokenAuth0Id= (!error) ? decoded.sub : null;
        return {
            authUser: {
                ...decoded,
                tokenAuth0Id,
            },
        }
    },
});
server.applyMiddleware({ app, path: '/api' });

app.listen(process.env.SERVER_PORT, () => {
    console.log(
        "Server instantiated. Listening on port " + process.env.SERVER_PORT + "."
    );
});
