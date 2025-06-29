import mongoose from 'mongoose';

export const connection = () => {
    const connectionParams = {
        useNewUrlParser: true
    };

    try { 
        if (!process.env.DB) {
            console.log("Database URI is not defined in .env");
            return;
        }
        
        mongoose.connect(process.env.DB, connectionParams);
        console.log("Connected to database");
    }
    catch (error) {
        console.log("Error connecting to database", error);
    }
};
