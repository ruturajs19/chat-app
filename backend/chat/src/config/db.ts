import mongoose from "mongoose"
export default async () => {
    const url = process.env.MONGO_URL;

    if(!url) {
        throw new Error('Mongo url not found')
    }

    try{
        await mongoose.connect(url,{
            dbName: 'ChatApp'
        })
        console.log("Connected to DB")
    }catch(error){
        console.error("Failed to connect to DB", error)
        process.exit(1)
    }
} 