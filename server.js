const express = require('express');
const app = express();
const routes = express.Router();
const port = 5000;
const cors = require('cors');
const bodyparser = require('body-parser');
const { MongoClient, ServerApiVersion } = require('mongodb');

const database = 'sensationrock';
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
const uri = "";
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
        //---------- CRUD READ
        routes.get("/concours", function (req, res) {
            concours.find().toArray()
                .then((err, results) => {
                    if (err) { return res.send(err) }
                    res.status(200).send({ results });
                })
                .catch(err => res.send(err));
        });
        //--------- CRUD CREATE
        routes.post("/concours/add", jsonParser, function (req, res) {
            res.send(req.body);
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

