const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 3000;

// midleware
app.use(
  cors({
    origin: ["https://assignment-12-819b8.web.app", "http://localhost:5173"],
  })
);
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wugjgdu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;




// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});




// database and collection
const database = client.db("touristDB");
const userCollection = database.collection("userDB");
const packagesCollection = database.collection("tourPackages");
const bookingCollection = database.collection("bookingDB");
const wishCollection = database.collection("wishListCollection");
const storyCollection = database.collection("storyCollection");
const commentCollection = database.collection("commentCollection");

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();


    const verifyToken = (req,res,next)=>{
      const token = req.headers.token;
      if(!token){
        return res.status(403).send("unAuthorized")
      }
      jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
        // console.log(decoded);
        req.decoded = decoded;
        if(decoded){
          if(!req.body.email === decoded.email){
            return res.ststus(402).send("forbidden access")
          }
          next()
        }
      })
      
    }

    // test API
    app.get("/", async (req, res) => {
      res.send("Server Connected Successfully");
    });

    // jwt generate
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send(token);
    });

    

    // save new user to database
    app.post("/user",verifyToken, async (req, res) => {
      const userInfo = req.body;
      const query = { email: userInfo.email };
      const exist = await userCollection.findOne(query);
      if (exist) {
        return res.send({ exist: true });
      }
      const result = await userCollection.insertOne(userInfo);
      res.send({ exist: false });
    });

    // get all user
    app.get("/users",verifyToken, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // get users by filter
    app.get("/users/:text",verifyToken, async (req, res) => {
      const text = req.params.text;
      const filter = { name: { $regex: text, $options: "i" } };
      const result = await userCollection.find(filter).toArray();
      res.send(result);
    });

    // get users by filter
    app.get("/users/filter/:text", verifyToken, async (req, res) => {
      const text = req.params.text;
      const filter = { role: text };
      const result = await userCollection.find(filter).toArray();
      res.send(result);
      // console.log(text);
    });

    // check is Admin
    app.get("/user/admin/:email", verifyToken ,async (req, res) => {
      
      const email = req.params.email;
      const query = { email: email };

      let admin = false;
      const user = await userCollection.findOne(query);
      if (user) {
        admin = user?.role === "admin";
      }
      res.send(admin);
    });

    // check is Guide
    app.get("/user/guide/:email",verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };

      let guide = false;
      const user = await userCollection.findOne(query);
      if (user) {
        guide = user?.role === "guide";
      }
      res.send(guide);
    });

    //check is Requested
    app.get("/user/role/:email",verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };

      let isRequested = false;
      const user = await userCollection.findOne(query);
      if (user) {
        isRequested = user?.role === "requested";
      }
      res.send(isRequested);
    });

    // api for make admin

    app.patch("/user/admin/:id",verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // api for request guide
    app.patch("/user/request/guide",verifyToken, async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const updatedDoc = {
        $set: {
          role: "requested",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // api for make guide

    app.patch("/user/guide/:id",verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "guide",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // api for accept booking
    app.patch("/booking/accept/:id",verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: "accepted",
        },
      };
      const result = await bookingCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    //   api for reject booking
    app.patch("/booking/reject/:id",verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: "rejected",
        },
      };
      const result = await bookingCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // add package api

    app.post("/package",verifyToken, async (req, res) => {
      const data = req.body;
      const result = await packagesCollection.insertOne(data);
      res.send(result);
    });

    // Api for get all packages
    app.get("/packages", async (req, res) => {
      const result = await packagesCollection.find().toArray();
      res.send(result);
    });

    // api for get last 3 packages
    app.get("/packages/last", async (req, res) => {
      const result = await packagesCollection.find().limit(3).toArray();
      res.send(result);
    });

    // api for getting specific package
    app.get("/package/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await packagesCollection.findOne(query);
      res.send(result);
    });

    // api for get packages based on tourType
    app.get("/packages/tour-type/:type", async (req, res) => {
      const type = req.params.type;
      const query = { tourType: type };
      const result = await packagesCollection.find(query).toArray();
      res.send(result);
    });

    // api for loading guides
    app.get("/guides", async (req, res) => {
      const query = { role: "guide" };
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    // api for loading specific guide
    app.get("/guide/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    // api for booking packages
    app.post("/booking",verifyToken, async (req, res) => {
      const data = req.body;
      const result = await bookingCollection.insertOne(data);
      res.send(result);
    });

    // Api for get my bookings
    app.get("/my-bookings",verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    // api for delete my booking
    app.delete("/my-booking/delete/:id",verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    // api for creating wishList
    app.post("/wish-list",verifyToken, async (req, res) => {
      const data = req.body;
      const result = await wishCollection.insertOne(data);
      res.send(result);
    });

    //api for get all wishlist
    app.get("/wish-lists",verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { wishEmail: email };
      const result = await wishCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/wish-list/delete/:id",verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishCollection.deleteOne(query);
      res.send(result);
    });

    // api for get my asiigned tours
    app.get("/assigned-tours",verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { guideEmail: email };
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    // api for adding Story
    app.post("/story",verifyToken, async (req, res) => {
      const data = req.body;
      const result = await storyCollection.insertOne(data);
      res.send(result);
    });

    // api for geetting stories
    app.get("/stories", async (req, res) => {
      const result = await storyCollection.find().toArray();
      res.send(result);
    });

    // api for geetting stories last 3
    app.get("/stories/last", async (req, res) => {
      const result = await storyCollection.find().limit(4).toArray();
      res.send(result);
    });

    // api for geetting specific story
    app.get("/story/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await storyCollection.findOne(query);
      res.send(result);
    });

    // api for saving comments
    app.post("/comment",verifyToken, async (req, res) => {
      const comment = req.body;
      const result = await commentCollection.insertOne(comment);
      res.send(result);
    });

    // api for getting comment
    app.get("/comments", async (req, res) => {
      const guideEmail = req.query.email;
      const query = { guideEmail: guideEmail };
      const result = await commentCollection.find(query).toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`server in running on PORT ${port}`);
});
