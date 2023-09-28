import { app } from "../app.js";
import supertest from "supertest";
import jest from "jest"
import dotenv from "dotenv"
import mongoose from "mongoose";
import { newUserValidation } from "../validation/index.js";
import { testLogger } from "../../tempFunctions.js";
// Using modules cross-env is needed with node env variable set in the "test" script
const request = supertest(app)


// Manual Mock Testing : 
// global.fetch = jest.fn(() =>
//   Promise.resolve({
//     json: () => Promise.resolve({ rates: { CAD: 1.42 } }),
//   })
// );


// Is run before each test, can be used to reset/disable 
beforeEach(() => {
})

describe("Testing the testing environment", () => {

    it("should check that true is true", () => {
        expect(true).toBe(true);
    });


})

const newUserTemplate = {
        "name": "testUser",
        "surname":"testSurname",
        "password":"IAmAPassword",
        "email":"cian.markwick@onyxdiscovery.com",
        "role":"admin"    
}
const userLoginDetails = {
        "password":"IAmAPassword",
        "email":"cian.markwick@onyxdiscovery.com",
}
const failUserTemplate = {
        "name": "testUser",
        "surname":"testSurname",
        "password":"IAmAPassword",
        "email":"cian.markwickonyxdiscovery.com",
        "role":"admin"    
}
let userId
let userName
let accessToken
let refreshToken
let newRefreshToken
let newAccessToken
describe("testing the app endpoints", () => {


    // If using a databese express-mongoose, you can use the following code to test the database:
            beforeAll(done => {
                console.log("This gets run before all tests in this suite")
            
                mongoose.connect(process.env.MONGO_URL_TEST).then(() => {
                    console.log("Connected to the test database")
                    done()
                })
            })

        
    it("should check that the app is running", async () => {
        const response = await request.get("/test");
        expect(response.status).toBe(200);
    })

    // Database positive check by creating a user and checking that it exists in the database
    it("should create a new user to test the database", async () => {
        const response = await request.post("/users/new").send(newUserTemplate);
        // testLogger(response.body)
        expect(response.status).toBe(201);
        expect(typeof response.body.userId).toBe("string");
    })
    // Database negative user create by trying to create a user with the same email as the one created above
    it("should fail to create a new user because the email is already in use", async () => {
        const response = await request.post("/users/new").send(newUserTemplate);
        expect(response.status).toBe(403);
        expect(response.body.message).toBe("email already in use");
    })
    // Login as the user created above and retrive the access token
    it("Login successfully and recieve the access token and refresh token from the header", async () => {
        const response = await request.post("/users/login").send(userLoginDetails);
        expect(response.status).toBe(200);
        expect(response.body.loggedIn).toBe(true);
        // testLogger( response.headers.accesstoken)
        userId = response.body.user._id
        accessToken = response.headers.accesstoken
        refreshToken = response.headers.accesstoken
        expect(response.headers.accesstoken).toBeDefined();
        expect(response.headers.refreshtoken).toBeDefined();
    })
    // use the access token to get the user details
    it("successfully use access token to get user's own information", async () => {
        const response = await request.get(`/users/self`).set({authorization: `Bearer ${accessToken}`});
        expect(response.status).toBe(200);
        // testLogger("body", response.body)
        expect(response.body.user._id === userId).toBe(true);
    })
    // use the refresh token to get a new access token
    it("successfully use refresh token to get a new access token and refresh token", async () => {
        const response = await request.put(`/users/refreshToken`).set({authorization: `Bearer ${refreshToken}`, accessToken: accessToken, refreshToken: refreshToken});
        expect(response.status).toBe(200);
        expect(response.headers.accesstoken).toBeDefined();
        expect(response.headers.refreshtoken).toBeDefined();
        newAccessToken = response.headers.accesstoken
        newRefreshToken = response.headers.refreshtoken
        // testLogger( response.headers.accesstoken)
    })
    // Test that the old refresh token is blacklisted
    it("should fail to use the same refreshToken to repeatedly get a new access token", async () => {
        const response = await request.put(`/users/refreshToken`).set({authorization: `Bearer ${refreshToken}`, accessToken: accessToken, refreshToken: refreshToken});
        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Token blacklisted")
    })
    // Test that the old access token is blacklisted
    it("should fail to use the old access token get user info", async () => {
        const response = await request.get(`/users/self`).set({authorization: `Bearer ${accessToken}`});
        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Token blacklisted")
    })
    // use the new access token to get the user details
    it("successfully use the new access token ", async () => {
        const response = await request.get(`/users/self`).set({authorization: `Bearer ${newAccessToken}`});
        expect(response.status).toBe(200);
        // testLogger( response.headers.accesstoken)
        expect(response.body.user._id === userId).toBe(true);
    })

    // CONTINUE FROM HERE

    // Delete the previously created user
    it("should delete the previously created user", async () => {
        const response = await request.delete(`/users/${userId}`).set({authorization: `Bearer ${newAccessToken}`});
    //  testLogger(response)
        expect(response.status).toBe(200);
        expect(response.body.message).toBe("User deleted");
    })



})


// afterAll(() => {
//     request.close()
// })