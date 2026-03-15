const mongoose = require("mongoose");

let gridfsBucket;

const initGridFS = () => {

    const conn = mongoose.connection;

    if (conn.readyState === 1) {
        gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
            bucketName: "studentImages"
        });

        console.log("✅ GridFS initialized");
    }
};

const getBucket = () => gridfsBucket;

module.exports = {
    initGridFS,
    getBucket
};