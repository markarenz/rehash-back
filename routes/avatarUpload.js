const isTokenValid = require("../authValidate");
const AWS = require("aws-sdk");
const sharp = require("sharp");
var sizeOf = require("image-size");
// const multer = require("multer");
// const fs = require("fs");
// const path = require("path");
const User = require("../models/user.model");
const { ObjectId } = require('mongodb');

exports.processAvatarUpload = async (req, res, next) => {
    const token = (req.headers && req.headers.authorization) ? req.headers.authorization : null;
    const auth0Id = req.body.auth0Id;
    const userId = req.body.userId;
    const oldAvatar = req.body.oldAvatar;
    console.log('OLD AVATAR', oldAvatar);
    if (token) {
        const {error, decoded} = await isTokenValid(token);
        if (decoded) {
            const tokenAuth0Id = decoded.sub;
            // auth0 IDs must match
            if (auth0Id === tokenAuth0Id) {
                const filename = `${userId}-${new Date().getTime()}.jpg`; // Convert to JPG below
                const s3 = new AWS.S3({
                    accessKeyId: process.env.AWS__ACCESS_KEY,
                    secretAccessKey: process.env.AWS__ACCESS_SECRET
                });
                // resize image
                const file = req.files.photo;
                const imgSize = sizeOf(file.data);
                sharp(file.data)
                    .resize(300, 300)
                    .toFormat('jpeg')
                    .jpeg({
                        quality: 90,
                        chromaSubsampling: '4:4:4',
                        force: true,
                    })
                    .toBuffer()
                    .then(data => {
                        const params = {
                            Bucket: process.env.AWS__BUCKET_NAME,
                            Key: "avatars/" + filename,
                            Body: data,
                            ACL: "public-read"
                        };
                        s3.upload(params, function(err, data) {
                            if (err) {
                                console.log('S3.Upload ERROR: ', err);
                            }
                            // delete old version if it exists
                            if (oldAvatar.includes(process.env.AWS__BUCKET_NAME)){
                                //https://s3.amazonaws.com/rehash.ridiculopathy.com/avatars/5ec51d0c0bf28661ab5aa60b.jpg
                                const deleteParams = {
                                    Bucket: process.env.AWS__BUCKET_NAME,
                                    Key: oldAvatar.replace(process.env.AWS__BASE_DIR,''),
                                };
                                s3.deleteObject(deleteParams, function(err, data) {
                                    if (err) {
                                        console.log('Error:', err);
                                    } else {
                                        // success
                                        // console.log('File deleted');
                                    }
                                })
                            }
                            // save avatar name to db
                            User.findById({ _id: ObjectId(userId) }, async (err, user) => {
                                if (err) {
                                    console.log('err', err);
                                }
                                user.avatar = data.Location;
                                user.save();
                                res.send(user);
                            });
                        });
                    });

                // traditional upload
                // res.send(req.body.photo);
            }
        } else {
            console.log('error in checking Token', error);
        }
    }
};
