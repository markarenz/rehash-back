const User = require("../models/user.model");
const Post = require("../models/post.model");
const Fav = require("../models/fav.model");
const Alert = require("../models/alert.model");
const Message = require("../models/message.model");
const isTokenValid = require("../authValidate");
const { ObjectId } = require('mongodb');
const AWS = require("aws-sdk");
var sizeOf = require("image-size");
const sharp = require("sharp");
const path = require('path');
const { UserInputError, AuthenticationError } = require('apollo-server-express');

const checkUserLevel = (score) => {
    const levelBreaksDeltas = [150, 200, 300, 450, 650, 900, 1200, 1550, 1950, 3000];
    let level = 0;
    let minScore = 0;
    levelBreaksDeltas.map((d, idx) => {
        minScore = minScore + d;
        if (score > minScore) {
            level = idx;
        }
        return null;
    });
    return level;
};

const calcUserScore = (user) => {
    let score = user.bonus;
    score = score + user.numPosts * 5;
    score = score + user.numLikes * 10;
    score = score + user.numFollowers * 12;
    return score;
};

const createAlert = async (alertType, alertUser, alertMessage, alertLinkType, alertLinkId) => {
    // alertLinkId saved as a string since we do not know if it is of type post or author
    try {
        const newAlert = new Alert({
            alertType,
            alertUser: ObjectId(alertUser),
            alertMessage,
            alertLinkType,
            alertLinkId,
            isRead: false,
            createdAt: new Date().getTime(),
        });
        const alertSaved = await newAlert.save();
        return alertSaved;
    } catch (e) {
        console.log('Error', e);
        return new UserInputError('What happened? My brain hurts. Try again later.');
    }
};

const resolvers = {
    Query: {
        getUserById: async (parent, args, context) => {
            const { id } = args;
            console.log('ID', id);
            const user = await User.findOne({_id: ObjectId(id)});
            console.log('??', user);
            return user;
        },
        getAlerts: async (parent, args, context) => {
            const { offset, itemsPerPage } = args;
            const { authUser } = await context;
            if (authUser) {
                const thisUser = await User.findOne({auth0Id: authUser.sub});
                if (thisUser) {
                    const alerts =  await Alert.find({
                        alertUser: thisUser._id,
                    }).limit(itemsPerPage).skip(offset).sort('-createdAt');
                    if (alerts) {
                        await Alert.updateMany({
                            alertUser: thisUser._id,
                            isRead: false,
                        }, {
                            $set: {
                                isRead: true,
                            }
                        })
                    }
                    return alerts;
                }
            }
            return [];
        },
        getUnreadAlerts: async (parent, args, context) => {
            const { authUser } = await context;
            if (authUser) {
                const thisUser = await User.findOne({auth0Id: authUser.sub});
                if (thisUser) {
                    const numUnreadAlerts = await Alert.countDocuments({
                        alertUser: thisUser._id,
                        isRead: false,
                    })
                    return { numUnreadAlerts };
                }
            }
            return { numUnreadAlerts: 0 };
        },
        getUnreadMessages: async (parent, args, context) => {
            const { authUser } = await context;
            if (authUser) {
                const thisUser = await User.findOne({auth0Id: authUser.sub});
                if (thisUser) {
                    const numUnreadMessages = await Message.countDocuments({
                        toUser: thisUser._id,
                        isRead: false,
                    })
                    return { numUnreadMessages };
                }
            }
            return { numUnreadMessages: 0 };
        },
        getMessages: async (parent, args, context) => {
            const { offset, itemsPerPage } = args;
            const { authUser } = await context;
            if (authUser) {
                const thisUser = await User.findOne({auth0Id: authUser.sub});
                if (thisUser) {
                    const messages =  await Message.find({
                        toUser: thisUser._id,
                    }).limit(itemsPerPage).skip(offset).sort('-createdAt').populate('fromUser');
                    if (messages) {
                        await Message.updateMany({
                            toUser: thisUser._id,
                            isRead: false,
                        }, {
                            $set: {
                                isRead: true,
                            }
                        })
                    }
                    return messages;
                }
            }
            return [];
        },
        getPosts: async (parent, args, context) => {
            const { search, filterFavs, userId, offset, itemsPerPage } = args;
            const query = {};
            if (search !== ''){
                query.content = {$regex: search, $options: 'i'};
            }
            let posts = await Post.find(query).sort('-createdAt').skip(offset).limit(itemsPerPage).populate('postAuthor');
            const { authUser } = await context;
            if (authUser) {
                const thisUser = await User.findOne({ auth0Id: authUser.sub });
                if (thisUser) {
                    posts = posts.map(async (item) => {
                        const favedByUser = await Fav.findOne({favPost: ObjectId(item._id), favUser: ObjectId(thisUser._id)});
                        item.isFaved = (favedByUser) ? true : false;
                        if (filterFavs) {
                            if (item.isFaved) {
                                return item
                            }
                        } else {
                            return item;
                        }
                    });
                }
            }
            return posts;
        },
    },
    Mutation: {
        sendMessage: async (parent, args, context) => {
            const { toUser,  fromUser, content } = args;
            try {
                const { authUser } = await context;
                if (!authUser){
                    return new AuthenticationError('User not logged in. Ref ID: sendMessage98621');
                }
                const toUserResult = await User.findOne({ _id: ObjectId(toUser) });
                const fromUserResult = await User.findOne({ _id: ObjectId(fromUser) });
                if (!toUserResult || !fromUserResult) {
                    // throw params error
                    return new UserInputError('Silly, Billy. This re:hasher does not exist.', {
                        invalidArgs: Object.keys(args),
                    });
                }
                const message = new Message({
                    toUser: ObjectId(toUser),
                    fromUser: ObjectId(fromUser),
                    content,
                    isRead: false,
                    createdAt: new Date().getTime(),
                    modifiedAt: new Date().getTime()
                });
                await message.save();
                return { success: true };
            } catch (e) {
                console.log('Error', e);
                return new AuthenticationError('User not logged in. Ref ID: GGFs18762hakjHGF');
            }
        },
        deleteAlert: async (parent, args, context) => {
            const { alertId } = args;
            const result = await Alert.findByIdAndDelete(ObjectId(alertId));
            if (result) {
                return { success: true };
            }
            return { success: false };
        },
        deleteMessage: async (parent, args, context) => {
            const { messageId } = args;
            console.log('\n\nDELETE MESSAGE\n\n', messageId);
            const result = await Message.findByIdAndDelete(ObjectId(messageId));
            if (result) {
                return { success: true };
            }
            return { success: false };
        },
        favPost: async (parent, args, context) => {
            try {
                const { authUser } = await context;
                if (!authUser){
                    return new AuthenticationError('User not logged in. Ref ID: createPost134');
                }
                const { isFav, favUser, favPost } = args;
                const fav = await Fav.findOne({ favUser, favPost});
                // we use the auth0Id to enforce auth + same user rules
                const favedPost = await Post.findOne({ _id: ObjectId(favPost) });
                if (!favedPost){
                    return new UserInputError('What? That post does not even exist!', {
                        invalidArgs: Object.keys(args),
                    });
                }
                const favingUser = await User.findOne({ auth0Id: authUser.sub });
                const favedUser = await User.findOne({ _id: ObjectId(favedPost.postAuthor) });
                if (!favedUser){
                    return new UserInputError('What? That user does not even exist!', {
                        invalidArgs: Object.keys(args),
                    });
                }
                const numLikes =  parseInt(favedUser.numLikes, 10);
                favedUser.numLikes = (!fav) ? numLikes + 1 : numLikes - 1;
                favedUser.score = calcUserScore(favedUser);
                favedUser.level = checkUserLevel(favedUser.score);
                favedUser.save();
                const numLikesPost =  parseInt(favedPost.likes, 10);
                favedPost.likes = (!fav) ? numLikesPost + 1 : numLikesPost - 1;
                favedPost.save();
                if (isFav) {
                    if (fav){
                        return fav._id;
                    }
                    const newFav = new Fav({
                        favUser: ObjectId(favUser),
                        favPost: ObjectId(favPost),
                        createdAt: new Date().getTime(),
                    });
                    const favSaved = await newFav.save();
                    // no need to return since we'll be creating an alert & returning that result
                } else {
                    if (fav){
                        await Fav.findByIdAndDelete(ObjectId(fav._id));
                        return fav._id;
                    } else {
                        // return '';
                    }
                }
                // Create alert for post favedUser (author)
                const message = (favedUser.auth0Id === authUser.sub) ? 'You liked your own post! Self love is important. Good for you!' : `${favingUser.name} liked your post. Congrats!`;
                return createAlert('fav', favedUser._id, message, 'post', favPost);
            } catch (e) {
                console.log('Error', e);
                return new AuthenticationError('User not logged in. Ref ID: kjhhgKJHG1869786');
            }
        },
        createPost: async (parent, args, context ) => {
            const { content } = args;
            try {
                const { authUser } = await context;
                if (!authUser){
                    return new AuthenticationError('User not logged in. Ref ID: createPost134');
                }
                const thisUser = await User.findOne({ auth0Id: authUser.sub });
                if (!thisUser) {
                    return new UserInputError('Silly, Billy. This re:hasher does not exist.', {
                        invalidArgs: Object.keys(args),
                    });
                }
                const post = new Post({
                    content,
                    postAuthor: ObjectId(thisUser._id),
                    tags: [],
                    likes: 0,
                    createdAt: new Date().getTime(),
                    modifiedAt: new Date().getTime()
                });
                thisUser.numPosts = parseInt(thisUser.numPosts, 10) + 1;
                thisUser.score = calcUserScore(thisUser);
                thisUser.level = checkUserLevel(thisUser.score);
                thisUser.save();
                return await post.save();
            } catch (e) {
                console.log('Error', e);
                return new AuthenticationError('User not logged in. Ref ID: kjhhgKJHG1869786');
            }
        },
        getOrCreateUser: async (parent, { auth0Id, name, avatar, email }, context ) => {
            try {
                const { authUser } = await context;
                if (!authUser){
                    // not authenticated...
                    // throw error
                }
                const existingUser = await User.findOne({ auth0Id: auth0Id });
                if (existingUser) {
                    return existingUser;
                }
                let user = new User({
                    auth0Id: auth0Id,
                    name: name,
                    avatar: avatar,
                    email: email,
                    active: true,
                    bio: '',
                    tags: [],
                    slogan: [0,0,0],
                    level: 0,
                    score: 0,
                    numPosts: 0,
                    numLikes: 0,
                    numFollowers: 0,
                    bonus: 0,
                    createdAt: new Date().getTime(),
                    modifiedAt: new Date().getTime()
                });
                const savedUser = await user.save().catch((err) => console.log('ERROR: ', err));
                return savedUser;

            } catch (e) {
                console.log(e);
                return new AuthenticationError('User not logged in. Ref ID: 2JHG27fi');
            }
        },

        updateProfile: async (parent, args , context) => {
            try {
                const { authUser } = await context;
                if (authUser && authUser.name){
                    const { _id, name, bio, tags, slogan } = args;
                    const validationErrors = {};
                    const user = await User.findById({ _id: ObjectId(_id) })
                        .catch((err) => {
                            console.log('err find user: ', err);
                        });
                    if (!user){
                        return new UserInputError('This Re:hasher does not exist.', {
                            invalidArgs: Object.keys(args),
                        });
                    }
                    if (bio) {
                        user.bio = bio;
                    }
                    if (tags) {
                        user.tags = tags;
                    }
                    if (slogan) {
                        user.slogan = slogan;
                    }
                    // NOTE: Name changes do not currently push back to auth0; that is phase 2 (maybe)
                    if (name && user.name !== name) {
                        const uniqueCheck = await User.find({ name });
                        if (uniqueCheck.length > 0) {
                            return new UserInputError('Cool name choice. Sadly, it\'s already in use by another Re:hasher.', {
                                invalidArgs: Object.keys(args),
                            });
                        }
                        user.name = name;
                    }
                    // TODO: Email changes are disabled for now - this is a phase 2 item
                    // if (email) {
                    //     if (user.email !== email) {
                    //         user.email = email;
                    // }
                    if (authUser && authUser.tokenAuth0Id === user.auth0Id) {
                        return user.save();
                    } else {
                        return new UserInputError('Silly, person. You cannot update someone else\'s profile!', {
                            invalidArgs: Object.keys(args),
                        });
                    }
                } else {
                    return new AuthenticationError('User not logged in. Ref ID: 1329u62');
                }
            } catch (e) {
                console.log(e);
                return new AuthenticationError('You\'ve got to be logged in, silly person!', {
                    invalidArgs: Object.keys(args),
                });
            }

        },
    },
    // getUsers: async (_, context) => {
    //     // const { token } = await context();
    //     // const { error } = await isTokenValid(token);
    //     const users = await User.find();
    //     return !error
    //         ? users.toArray()
    //         : [];
    // },

    // getUserById: async ({ id }, context) => {
    //     if (await isAuthenticated(context)){
    //         const user = User.findOne({ _id: id });
    //         return user;
    //     } else {
    //         return {};
    //     }
    // },


};
module.exports = resolvers;
