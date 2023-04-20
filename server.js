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
        //-------------------------------------------------------------
        const concoursColl = client.db(database).collection("concours");
        const questColl = client.db(database).collection("questions");
        const usersColl = client.db(database).collection('users');
        //-------------------------------------------------------------
        //-------------------------USERS------------------------------------
        //-------------------------------------------------------------
        //create
        routes.post("/users/add", jsonParser, function (req, res) {
            usersColl.insertOne(req.body)
                .then((results) => {
                    res.status(200).send({ results });
                    console.log('ajout user ok');
                })
                .catch(err => res.send(err));
        });
        //read
        routes.get("/users", function (req, res) {
            usersColl.find().toArray()
                .then((err, results) => {
                    if (err) { return res.send(err) }
                    res.status(200).send({ results });
                })
                .catch(err => res.send(err));
        });
        // read avec idU
        routes.get("/user/:email", function (req, res) {
            usersColl.find({ email: req.params.email }).toArray()
                .then((err, results) => {
                    if (err) { return res.send(err) }
                    res.status(200).send({ results });
                })
                .catch(err => res.send(err));
        })
        //update

        //delete

        //-------------------------------------------------------------
        //-------------------------SCORE------------------------------------
        //-------------------------------------------------------------
        //read
        routes.get('/score/:idU/:idEv', function(req,res){
            let id= new ObjectId(req.params.idU);
            usersColl.find(
                {'_id': id, concours:{ $elemMatch: {'idEv': req.params.idEv}}}
            ).toArray()
            .then((err, results) => {
                if (err) { return res.send(err) }
                res.status(200).send({ results });
            })
            .catch(err => res.send(err));
        });
        //update
        routes.put('/score/modif/:idU', jsonParser, function(req,res){
            let id = new ObjectId(req.params.idU);
            usersColl.updateOne(
                {'_id':id , concours:{ $elemMatch: {'idEv': req.body.idEv}} },
                {$set: { "concours.$.nbPt": req.body.nbPt, "concours.$.nbQ": req.body.nbQ}})
        })

        //-------------------------------------------------------------
        //-------------------------CONCOURS------------------------------------
        //-------------------------------------------------------------
        //create
        routes.post("/concours/add", jsonParser, function (req, res) {
            concoursColl.insertOne(req.body)
                .then((results) => {
                    res.status(200).send({ results });
                    console.log('ajout concours ok');
                })
                .catch(err => res.send(err));
        });
        //read MUTLI
        routes.get("/concours", function (req, res) {
            concoursColl.find().toArray()
                .then((err, results) => {
                    if (err) { return res.send(err) }
                    res.status(200).send({ results });
                })
                .catch(err => res.send(err));
        });
        //read ONE 
        routes.get("/event/:idEv", function (req, res) {
            let id = new ObjectId(req.params.idEv);
            concoursColl.find({ '_id': id }).toArray()
                .then((err, results) => {
                    if (err) { return res.send(err) }
                    res.status(200).send({ results });
                })
                .catch(err => res.send(err));
        });
        //update
        routes.put("/concours/modif", jsonParser, function (req, res) {

            let id = new ObjectId(req.body['_id']);
            req.body['_id'] = id;/////////////// PRIMORDIAL SINON CHAMP PAS RECONNU LORS DU UPDATE 

            concoursColl.updateOne({ '_id': id }, { $set: req.body })
                .then(() => { res.status(200).send('modif event ok'); })
                .catch(err => res.send(err));
        });
        //delete
        routes.put("/concours/suppr", jsonParser, function (req, res) {
            let id = new ObjectId(req.body.id);
            concoursColl.deleteOne({ '_id': id })
                .then(() => { res.status(200).send('ok event suppr'); })
                .catch(err => res.send(err));
        });
        //-------------------------------------------------------------
        //-------------------------QUESTION------------------------------------
        //-------------------------------------------------------------
        //create
        routes.post("/questions/add", jsonParser, function (req, res) {
            questColl
                .insertOne(req.body)
                .then(() => res.status(200).send("successfully inserted new QUESTION"))
                .catch((err) => {
                    res.send(err);
                });
        });
        //read all
        routes.get("/questions", function (req, res) {
            questColl.find().toArray()
                .then((err, results) => {
                    if (err) { return res.send(err) }
                    res.status(200).send({ results });
                })
                .catch(err => res.send(err));
        });
        //read limit
        routes.get("/liste-generale/:limit", function (req, res) {
            let limit = Number(req.params.limit);
            questColl.find().limit(limit).toArray()
                .then((err, results) => {
                    if (err) { return res.send(err) }
                    res.status(200).send({ results });
                })
                .catch(err => res.send(err));
        });
        //read limit et param query
        routes.put("/liste-perso/:limit", jsonParser, function (req, res) {
            let limit = Number(req.params.limit);
            let tableauGouts = req.body.gouts;

            questColl.find({ Catégorie: { $in: tableauGouts } }).limit(limit).toArray()
                .then((err, results) => {
                    if (err) { return res.send(err) }
                    res.status(200).send({ results });
                })
                .catch(err => res.send(err));
        });
        
        //read limit liste spe
        routes.get("/liste-spe/:idEv/:limit", function (req, res) {
            let limit = Number(req.params.limit);
            let id = req.params.idEv
            let colek = client.db(database).collection(`q-${id}`);
            colek.find().limit(limit).toArray()
                .then((err, results) => {
                    if (err) { return res.send(err) }
                    res.status(200).send({ results });
                })
                .catch(err => res.send(err));
        });
        //update
        routes.put("/questions/modif", jsonParser, function (req, res) {
            let id = new ObjectId(req.body['_id']);
            req.body['_id'] = id;
            questColl.updateOne({ '_id': id }, { $set: req.body })
                .then(() => { res.status(200).send('modif question ok'); })
                .catch(err => res.send(err));
        });
        //delete
        routes.put("/questions/suppr", jsonParser, function (req, res) {
            let id = new ObjectId(req.body.id);
            questColl.deleteOne({ '_id': id })
                .then(() => { res.status(200).send('ok quest suppr'); })
                .catch(err => res.send(err));
        });
        //-----------------------------------------------------------------------

        //-----------------------------------------------------------------------
        //-----------------------------------------------------------------------
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

