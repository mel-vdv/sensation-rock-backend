const express = require('express');
const app = express();
const routes = express.Router();
const port = 5000;
const cors = require('cors');
const bodyparser = require('body-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const database = 'quiz';
const jsonParser = bodyparser.json();

// mini routesli au sein de l'routes:
app.use("/api", routes);
// on remplace routes par routes pour tout sauf app.listen et ici
// localhost:8080/api/produits

//cors :
routes.use(cors());
//bp :
routes.use(bodyparser.urlencoded({ extended: false }));
routes.use(bodyparser.json());

// MONGODB CLIENT-------------------------------------------------------
const uri = "mongodb+srv://melvdev:bibiegalnul@cluster-sensation-rock.mam0t6r.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// connect to db :------------------------------------------------------
client.connect((err) => {

    if (err) {
        console.log('pb');
        throw Error(err);
    }

})
    //si connect db success : 
    .then(() => {
        console.log('connect db success');
        const concours = client.db(database).collection("concours");
        const quest = client.db(database).collection("questions");
        const reglages = client.db(database).collection("reglages");
        const usersColl = client.db(database).collection('users');
        //---------- CRUD READ USERS
        routes.get("/users", function (req, res) {
            usersColl.find().toArray()
                .then((err, results) => {
                    if (err) { return res.send(err) }
                    res.status(200).send({ results });
                })
                .catch(err => res.send(err));
        });
        //---------- CRUD READ CONCOURS
        routes.get("/concours", function (req, res) {
            concours.find().toArray()
                .then((err, results) => {
                    if (err) { return res.send(err) }
                    res.status(200).send({ results });
                })
                .catch(err => res.send(err));
        });
        //---------- CRUD READ QUESTIONS
        routes.get("/questions", function (req, res) {
            quest.find().toArray()
                .then((err, results) => {
                    if (err) { return res.send(err) }
                    res.status(200).send({ results });
                })
                .catch(err => res.send(err));
        });
        //----------- CRUD CREATE QUESTION
        routes.post("/questions/add", jsonParser, function (req, res) {
            console.log('req body', req.body);
            quest
                .insertOne(req.body)
                .then(() => res.status(200).send("successfully inserted new QUESTION"))
                .catch((err) => {
                    res.send(err);
                });
        });
        //------------- DELETE
        routes.put("/questions/suppr", jsonParser, function(req,res){
            console.log('sereur : ',req.body.id);
            let id = new ObjectId(req.body.id);
            quest.deleteOne({'_id': id})
            .then(() => {res.status(200).send('ok quest suppr');})
            .catch(err => res.send(err));
        });
         //----------- CRUD CREATE EVENT
         routes.post("/concours/add", jsonParser, function (req, res) {
            console.log('req body', req.body);
            quest
                .insertOne(req.body)
                .then(() => res.status(200).send("successfully inserted new EVENT"))
                .catch((err) => {
                    res.send(err);
                });
        });
        //---------- CRUD READ REGLAGES ADMIN
        routes.get("/reglages", function (req, res) {
            reglages.find().toArray()
                .then((err, results) => {
                    if (err) { return res.send(err) }
                    res.status(200).send({ results });
                })
                .catch(err => res.send(err));
        });
        //---------- CRUD UPDATE REGLAGES ADMIN/////////// !!!!! ne pas oublier de mettre PUT
        routes.put("/reglages/modif", jsonParser, function(req,res){
            reglages.updateOne({id:1}, {$set:req.body})
            .then(() => {res.status(200).send('modif regl ok');})
            .catch(err => res.send(err));
        });
        //--------- CRUD CREATE
        routes.post("/concours/add", jsonParser, function (req, res) {
          //  res.send(req.body);
            concours.insertOne(req.body)
                /*
                    produits.insertOne({
                        id:29999,
                        name: "pull",
                        price:299,
                        category:'clothes'
                     })*/
                // si requete successfull :
                .then((results) => {
                    res.status(200).send({ results });
                    console.log('ajout concours ok');
                })
                // sirequete echec :
                .catch(err => res.send(err));
        });
    })
    // si connect db error :
    .catch(err => {
        console.error(err.message);
        res.send(err);
    });



//----------- connect to server -----------------------------------------
app.listen(port, () => {
    console.log(`server up and running on port ${port}`);
})
//-----------------------------------------------------

/*ROUTES POUR CREER UNE API RESTFUL qui permet d'envoyer des requetes
but = communiquer avec la base de données (mongoDB): 
routes.get
routes.put
routes.post
routes.delete
*/

routes.get("/", (req, res) => {
    res.send("hello world");
});
//-------------

