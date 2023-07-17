const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
// on crée une instance de router : 
const routes = express.Router();
const port = process.env.PORT || 5000;// important que PORT soit en majuscule

const bodyparser = require('body-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');

const database = 'quiz';
const jsonParser = bodyparser.json();

// mini routesli au sein de l'routes:
// ici 'api' est l'url de base :
app.use("/api", routes);
// on remplace routes par routes pour tout sauf app.listen et ici
// localhost:8080/api/produits


//cors :
routes.use(cors());
//bp :
routes.use(bodyparser.urlencoded({ extended: false }));
routes.use(bodyparser.json());

// MONGODB CLIENT-------------------------------------------------------
const uri = process.env.STRING_URI || "mongodb+srv://melvdev:bibiegalnul@cluster-sensation-rock.mam0t6r.mongodb.net/?retryWrites=true&w=majority";
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
        const msgColl = client.db(database).collection('messages');
        const newslettersColl = client.db(database).collection('newsletters');
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
        //verifier si email et/ou pseudo existe déjà :

        routes.post("/user/verifinscr", jsonParser, function (req, res) {
            console.log('verifinscr', req.body.email, req.body.pseudo);
            usersColl.find({ $or: [{ email: req.body.email }, { pseudo: req.body.pseudo }] }).toArray()
                .then((err, results) => {
                    if (err || !results) {
                        return res.send(err);
                    }
                    else {
                        console.log(results);
                        res.status(200).send({ results });
                    }

                })
                .catch(err => res.send(err));
        })
        // read avec email
        routes.post("/user", jsonParser, function (req, res) {
            usersColl.find({ email: req.body.email }).toArray()
                .then((err, results) => {
                    if (err) { return res.send(err) }
                    res.status(200).send({ results });
                })
                .catch(err => res.send(err));
        })
        // read avec email + mdp : 
        routes.post("/user/verifco", jsonParser, function (req, res) {
            console.log('verifco', req.body.email, req.body.mdp);
            usersColl.find({ $and: [{ email: req.body.email }, { mdp: req.body.mdp }] }).toArray()
                .then((err, results) => {
                    if (err) { return res.send(err) }
                    res.status(200).send({ results });
                })
                .catch(err => res.send(err));
        })
        //update
        routes.put('/user/modif/:idU', jsonParser, function (req, res) {
            let id = new ObjectId(req.params.idU);
            usersColl.updateOne(
                { '_id': id },
                { $set: req.body })
        });
        //delete
        routes.put('/user/suppr/:idu', function (req, res) {
            let id = new ObjectId(req.params.idu);
            usersColl.deleteOne({ '_id': id });
        })
        //-------------------------------------------------------------
        //---------------------------NEWSLETTERS----------------------------------
        //-------------------------------------------------------------
        //create newsletters>listing>emails [] : 
        routes.post("/newsletters/add", jsonParser, function (req, res) {
            let email = req.body.email;
            //updateone marche que si doc listing existe deja 
            newslettersColl.updateOne(
                { '_id': 'listing' },
                {
                    $push: { emails: email }
                })
                .then((results) => {
                    res.status(200).send({ results });
                    console.log('ajout email ok');
                })
                .catch(err => res.send(err));
        });
        //-------------------------------------------------------------
        //---------------------------PODIUM----------------------------------
        //-------------------------------------------------------------
        //read
        routes.get('/podium/:idU/:idEv', function (req, res) {
            let idEv = new ObjectId(req.params.idEv);
            //let idU= new ObjectId(req.params.idU);
            concoursColl.find(
                { '_id': idEv }
            )
                .toArray()
                .then((err, results) => {
                    if (err) { return res.send(err) }
                    res.status(200).send({ results });
                })
                .catch(err => res.send(err));
        });
        //-------------------------------------------------------------
        //-------------------------SCORE------------------------------------
        //-------------------------------------------------------------
        //create
        routes.put("/score/add/:idU", jsonParser, function (req, res) {
            let id = new ObjectId(req.params.idU);

            usersColl.updateOne(
                { '_id': id },
                {
                    $push: { concours: req.body }
                })
                .then((results) => {
                    res.status(200).send({ results });
                    console.log('ajout concours ok');
                })
                .catch(err => res.send(err));
        });
        //read
        routes.get('/score/:idU/:idEv', function (req, res) {
            let id = new ObjectId(req.params.idU);
            usersColl.find(
                { '_id': id, concours: { $elemMatch: { 'idEv': req.params.idEv } } }
            ).toArray()
                .then((err, results) => {
                    if (err) { return res.send(err) }
                    res.status(200).send({ results });
                })
                .catch(err => res.send(err));
        });
        //update
        routes.put('/score/modif/:idU', jsonParser, function (req, res) {
            let id = new ObjectId(req.params.idU);
            usersColl.updateOne(
                { '_id': id, concours: { $elemMatch: { 'idEv': req.body.idEv } } },
                { $set: { "concours.$.nbPt": req.body.nbPt, "concours.$.nbQ": req.body.nbQ } })
        });

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
        // update les participants du concours : incrementer le nbPt
        routes.put("/concours/modif/participants/:idEv/:idU", jsonParser, function (req, res) {
            console.log('etape3 server : ', req.params.idEv, req.params.idU, req.body.n);
            let id = new ObjectId(req.params.idEv);
            let n = req.body.n;
            concoursColl.updateOne({ '_id': id, participants: { $elemMatch: { 'idU': req.params.idU } } },
                { $inc: { "participants.$.nbPt": n } })
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
        // creer une collek de questions spe:
        routes.post('/add-coll-q-spe/:idEv', jsonParser, function (req, res) {
            let idEv = req.params.idEv;
            let collek = `q-${idEv}`;
            console.log('on créée : ', collek);
            console.log(JSON.stringify(req.body.tabQspe));
            let collSpe = client.db(database).collection(collek);
            collSpe.insertMany(req.body.tabQspe)
                .then(() => res.status(200).send("successfully creation new collection QUESTION specifique"))
                .catch((err) => {
                    res.send(err);
                });
        })
        //create une collection q-spe pour un ev et
        // update : ajouter des questiopns spe :
        routes.post("/questionspe/add/:idEv", jsonParser, function (req, res) {
            let idEv = req.params.idEv;
            let collek = `q-${idEv}`;
            let collSpe = client.db(database).collection(collek);
            collSpe
                .insertOne(req.body)
                .then(() => res.status(200).send("successfully inserted new QUESTION specifique"))
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
        //update
        routes.put("/questionspe/modif/:idEv", jsonParser, function (req, res) {
            let id = new ObjectId(req.body['_id']);
            req.body['_id'] = id;
            let collek = client.db(database).collection(`q-${req.params.idEv}`)
            collek.updateOne({ '_id': id }, { $set: req.body })
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
        //delete 2 :
        routes.put("/questionspe/suppr", jsonParser, function (req, res) {
            let idQ = new ObjectId(req.body.idQ);
            client.db(database).collection(`q-${req.body.idEv}`)
                .deleteOne({ '_id': idQ })
                .then(() => { res.status(200).send('ok quest suppr'); })
                .catch(err => res.send(err));
        });

        //-----------------------------------------------------------------------
        //------------------------------MESSAGES----------------------------------
        //-----------------------------------------------------------------------
        let adresseAdmin= "mellyvdv@gmail.com";
        //create
        routes.post("/msg/contact", jsonParser, function (req, res) {
            //etape 1 :
            let formulaire = req.body;
            //admin :
            var mail1 = {
                from: '"MELWIN"<melvdeve@gmail.com>',
                to: `${adresseAdmin}`,
                subject: "Nouveau formulaire de contact rempli sur MELWIN",
                text: "",
                html: `
                <h2>Formulaire de contact envoyé depuis la plateforme MELWIN : </h2>
                <p> Nom  : ${formulaire.nom}</p>
                <p> Prénom  : ${formulaire.prenom}</p>
                <p> Entreprise  : ${formulaire.entreprise}</p>
                <p> Email  : ${formulaire.email}</p>
                <p> TEL  : ${formulaire.tel}</p>
                <p> Demande  : ${formulaire.msg}</p>
                `
            }
            //user:
            let mail2={
                from: '"MELWIN"<melvdeve@gmail.com>',
                to: `${formulaire.email}`,
                subject: "Votre demande de contact a bien été prise en compte",
                text: `Votre demande a bien été prise en compte. L'équipe de MELWIN vous répondra dans les meilleurs délais.
                `,
                html: `
                <h2>Demande d'informations</h2>
                <p>Votre demande de contact a bien été prise en compte.</p>
                <p>L'équipe de MELWIN vous répondra dans les meilleurs délais.</p>
                `};
            envoyerMail(mail1);
            envoyerMail(mail2);
            //etape 2 : 
            msgColl.insertOne(req.body)
                .then((results) => {
                    res.status(200).send({ results });
                    console.log('ajout msg ok');
                })
                .catch(err => res.send(err));
            //-----------
        });
        //------
        routes.post("/msg/demande", jsonParser, function (req, res) {
            let adresse = req.body.email;
            //admin:
            var mail1 = {
                from: '"MELWIN"<melvdeve@gmail.com>',
                to: `${adresseAdmin}`,
                subject: "Nouvelle demande d'information",
                text: `Demande d'informations  : 
                Un utilisateur demande de recevoir des informations au sujet des modalités pour devenir annonceur sur la plateforme Melwin.
                à l'adresse amil suivante : ${adresse}
                `,
                html: `
                <h2>Demande d'informations</h2>
                <p>
                Un utilisateur demande de recevoir des informations au sujet des modalités pour devenir annonceur sur la plateforme Melwin 
                à l'adresse mail suivante : ${adresse}
                </p>
                `
            };
            //user :
            let mail2={
            from: '"MELWIN"<melvdeve@gmail.com>',
            to: `${adresse}`,
            subject: "Votre demande a bien été prise en compte",
            text: `Votre demande a bien été prise en compte. L'équipe de MELWIN vous répondra dans les meilleurs délais.
            `,
            html: `
            <h2>Demande d'informations</h2>
            <p>Votre demande a bien été prise en compte.</p>
            <p>L'équipe de MELWIN vous répondra dans les meilleurs délais.</p>
            `};
            envoyerMail(mail1);
            envoyerMail(mail2);
        })

        //-----------------------------------NODEMAILER
        routes.post("/msg/inscr", jsonParser, function (req, res) {
            let user = req.body.user;
            console.log('nouvel user : ', JSON.stringify(user));
            //admin :
            let mail1 = {
                from: '"MELWIN"<melvdeve@gmail.com>',
                to: `${adresseAdmin}`,
                subject: "Nouveau membre melwin",
                html:
                    `<h1>Une nouvelle inscription sur MELWIN !</h1>
                <h3> Coordonnées du nouveau membre : </h3>
                <p>NOM : ${user.nom}</p>
                <p>PRENOM : ${user.prénom}</p>
                <p>PSEUDO: ${user.pseudo}</p>
                <p>EMAIL: ${user.email}</p>
                <p>TELEPHONE : ${user.tel}</p>
                <p>CODE POSTAL : ${user.cp}</p>
                `
            }
            envoyerMail(mail1);
            //user :
            let mail2 = {
                from: '"MELWIN"<melvdeve@gmail.com>',
                to: `${user.email}`,
                subject: "Bienvenue sur melwin",
                html: `
                <h1> Bienvenue sur MELWIN </h1>
                <p>Merci ${user.pseudo} pour votre inscription</p>
                <p>Melwin met à l'honneur votre culture musicale.</p>
                <p>Remportez des places pour de cinéma, de théâtre, des concerts, restaurants,
                évènements sportifs, jeux et loisirs divers...</p>
                <p>De nouveaux concours sont régulièrement proposés sur la plateforme MELWIN.</p>
                <p>Pour tenter de nouveaux quizz : https://melwin-22bd209cfb50.herokuapp.com/ </p>
                `,
                text: "Bienvenue sur MELWIN ! De nouveaux concours sont régulièrement proposés sur la plateforme MELWIN. Remportez des places pour du cinéma, du théâtre, des concers, restaurants, évènements sportifs, et loisirs divers. Melwin met à l'honneur votre culture musicale. Tentez les quizz!"
            }
            envoyerMail(mail2);
        });
        //-----------------------------------NODEMAILER
        // un concours est fini : 
        routes.post("/msg/fin", jsonParser, function (req, res) {
            let gagnants = req.body.gagnants;
            let annonceur = req.body.annonceur;
            let gain = req.body.gain;
            let ev = req.body.ev;
            let liste = "";
            let emails = [];
            gagnants.forEach((g,i) => {
                liste += 
                `<p>- ${i+1}/ ${g.prénom} ${g.nom.toUpperCase()} ("${g.pseudo}")</p> 
                <p>- Email : ${g.email} </p>
                <p>- Tel : ${g.tel}</p>
                <p>----------------------------</p>`;
                emails.push(`${g.email}`);
            });
            // a l'admin
            let mail1 = {
                from: '"MELWIN"<melvdeve@gmail.com>',
                to:`${adresseAdmin}`,
                subject: "Fin d'un concours MELWIN",
                html: `
            <h1>Fin du concours</h1>
            <h2>de l'évènement "${ev}"</h2>
            <p>Gain : "${gain}"</p>
            <p>Coordonnées des gagnants : </p>
            <p>${liste}</p>
            <p> La liste des gagnants a été envoyées à l'annonceur à l'adresse ${annonceur}.</p>
            `
            };
            // à annonceur
            let mail2 = {
                from: '"MELWIN"<melvdeve@gmail.com>',
                to: `${annonceur}`,
                subject: "Fin de votre concours MELWIN",
                html: `
            <h1>Fin de votre concours</h1>
            <h2>pour l'évènement ${ev}</h2>
            <p>Coordonnées des gagnants : </p>
            <div>${liste}</div>
            <p>Nous vous laissons le soin d'envoyer aux gagnants leurs lots.</p>
            <p>Gain : ${gain}</p>
            <p>Au plaisir d'avoir pu collaborer ensemble,</p>
            <br>
            <p>L'équipe MELWIN</p>
            `
            };
            // aux gagnants :
            let mail3 = {
                from: '"MELWIN"<melvdeve@gmail.com>',
                to: `${emails}`,
                subject: "Vous avez gagné le concours MELWIN !!!",
                html: `
        <h1>Félicitations ! </h1>
        <h2>Vous avez remporté le concours de l'évènement "${ev}"</h2>
        <p>Votre gain : ${gain} </p>
        <p>Le responsable de l'évènement vous contactera pour vous remettre votre lot.</p>
        <p>De nouveaux concours sont régulièrement proposés sur la plateforme MELWIN.</p>
        <p>Pour tenter de nouveaux quizz : https://melwin-22bd209cfb50.herokuapp.com/ </p>
        <p>Au plaisir d'avoir pu collaborer ensemble,</p>
        <br>
        <p>L'équipe MELWIN</p>
        `};
            envoyerMail(mail1);
            envoyerMail(mail2);
            envoyerMail(mail3);
        });
        //-----------------------------------NODEMAILER
        var transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: false,
            service: "gmail",
            auth: {
                user: 'melvdeve@gmail.com',
                pass: 'wtmqyxmlxzxaozzl'
            }
        });
        var envoyerMail = (mail) => {

            transporter.sendMail(mail);

        }
        //-------------


    })
    // si connect db error :
    .catch(err => {
        console.error(err.message);
        res.send(err);
    });


//-----------------------------------------------------
//-----------------------------------------------------
// SERVIR DES FICHIERS STATIQUES    : (pour heroku)

/*
const public_path = path.join(__dirname, '../build');
app.use(express.static(public_path));
app.get("*", (_,res)=>{
    res.sendFile(path.join(public_path, 'index.html'));
})
*/
//-----------------------------------------------------
//--

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


//-------------

