// const { buildSchema } = require('graphql');
const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');

const app = express();

const schema = gql`
    type Post {
        _id: ID!
        content: String!
        tags: [String]
        likes: Int
        postAuthor: User!
        createdAt: String!
        modifiedAt: String!
        isFaved: Boolean
    }
    type Alert {
        _id: ID!
        alertType: String
        alertUser: User!
        alertMessage: String!
        alertLinkId: String
        alertLinkType: String
        isRead: Boolean
        createdAt: String!
    }
    type Message {
        _id: ID!
        fromUser: User!
        toUser: User!
        content: String!
        createdAt: String!
        isRead: Boolean!
    }
    type User{
        _id: ID!
        auth0Id: String!
        name: String!
        email: String!
        active: Boolean!
        bio: String!
        tags: [String]!
        slogan: [String]!
        avatar: String!
        level: Int!
        score: Int!
        numLikes: Int!
        numPosts: Int!
        numFollowers: Int!
        bonus: Int!
        createdAt: String!
        modifiedAt: String!
    }
    
    type Fav {
        _id: ID!
        favUser: User!
        favPost: Post!
    }
    type FavPostResult {
        _id: ID
    }
    type getUnreadAlertsResult {
        numUnreadAlerts: Int
    }
    type getUnreadMessagesResult {
        numUnreadMessages: Int
    }
    type DeleteResult {
        success: Boolean!
    }
    type SendMessageResult {
        success: Boolean!
    }
           
    type Query {
        getPosts(search: String, filterFavs: Boolean, userId: Int, offset: Int!, itemsPerPage: Int!): [Post!]!
        getUnreadAlerts: getUnreadAlertsResult
        getUnreadMessages: getUnreadMessagesResult
        getAlerts(offset: Int!, itemsPerPage: Int!): [Alert!]!
        getMessages(offset: Int!, itemsPerPage: Int!): [Message!]!
        getUserById(id: String): User
        post(_id: ID!): Post!
    }
    
    type Mutation {
        getOrCreateUser(auth0Id: String!, name: String!, avatar: String, email: String!): User!
        updateProfile(_id: String!, name: String, email: String, bio: String, tags: [String], slogan: [String]): User
        createPost(content: String!): Post
        favPost(isFav: Boolean!, favUser: String!, favPost: String!): FavPostResult
        sendMessage(toUser: String!, fromUser: String!, content: String!): SendMessageResult
        deleteAlert(alertId: String!): DeleteResult
        deleteMessage(messageId: String!): DeleteResult
    }
`;

module.exports = schema;

// getUsers(start: Int, offset: Int, itemsPerPage: Int): [User]!
//     getUserById(_id: ID!): User!

// createPost(content: String!, tags: String!, userID: ID!): Post!
//     updatePost(content: String, tags: String, likes: Int, createdAt: String): Post!
//     updateUser(_id: String!, name: String, email: String, bio: String, avatar: String, level: Int, score: Int, numLikes: Int, numPosts: Int, numFollowers: Int, bonus: Int ): User!
