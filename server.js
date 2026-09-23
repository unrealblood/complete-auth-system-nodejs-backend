import "dotenv/config";
import { app } from "./src/app.js";

app.listen(5000, (error) => {
    if(error) {
        throw new Error(error.message);
    }

    console.log("Server is up and running on port number: 5000");
})