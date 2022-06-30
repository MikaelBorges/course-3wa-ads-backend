const express = require('express')
const app = express()

const mysql = require('promise-mysql')

const fileUpload = require('express-fileupload')

//on crée un dossier racine ou l'on va stocker les images
app.use(fileUpload({
    createParentPath: true
}))

app.use(express.urlencoded({extended: false}))
app.use(express.json())

const cors = require('cors')

app.use(cors())

app.use(express.static(__dirname + '/public'))

mysql.createConnection({
    host: "db.3wa.io",
    database: "mikaelborges_annonces",
    user: "mikaelborges",
    password: "27877ec08c78216970586b5598f5acda"
    /*database: "monesma_annonces",
    user: "monesma",
    password: "c0b7990cb05833d15b0d5001963aa61a"*/
}).then((db)=>{
    console.log('connecté à la bdd')
    setInterval(async function(){
        let res = await db.query('SELECT 1')
    }, 10000)
    
    app.get('/', (req,res,next)=>{
        res.json({status: 200, results: "Welcome to your API bro!"})
    })
    
    //route de récupération de toutes les annonces
    app.get('/api/v1/ads', async (req, res, next)=>{
        let adsBDD = await db.query('SELECT * from ads')
        if(adsBDD.code){
            res.json({status: 500, error_msg: adsBDD})
        }
        
        res.json({status: 200, results: {ads: adsBDD}})
    })
    
    //route de récupération d'une seule annonce (par son id)
    app.get('/api/v1/ads/:id', async (req, res, next)=>{
        let id = req.params.id
        
        let adBDD = await db.query('SELECT * FROM ads WHERE Id = ?', [id])
        
        if(adBDD.code){
            res.json({status: 500, error_msg: adBDD})
        }
        
        res.json({status: 200, results: {ad: adBDD[0]}})
    })
    
    //une route de sauvegarde d'une annonce (pour l'image vous mettez req.body.url)
    app.post('/api/v1/ads/save', async (req, res, next)=>{
        let ajout = await db.query('INSERT INTO ads (Title, Contents, Url, CreationTimesTam) VALUES (?, ?, ?, NOW())', [req.body.title, req.body.contents, req.body.ur])
        
        if(ajout.code){
            res.json({status: 500, error_msg: ajout})
        }
        
        res.json({status: 200, result: "Annonce enregistrée!"})
    })
    
    //route d'ajout d'une image dans l'api (stock une image et retourne au front le nom de l'image stocké)
    app.post('/api/v1/ads/pict', (req, res, next)=>{
        //console.log(req.files.image)
        //si on a pas envoyé de req.files via le front ou que cet objet ne possède aucune propriété
        if(!req.files || Object.keys(req.files).length === 0){
            res.json({status: 400, msg: "La photo n'a pas pu être récupérée..."})
        }
        //si il n'est pas rentré dans la condition, du coup on a récupéré un fichier venant du front
        req.files.image.mv('public/images/'+ req.files.image.name, function(err){
            console.log("Ca passe:", `/public/images/${req.files.image.name}`)
            //si jamais on une erreur
            if(err){
                res.json({status: 500, msg: "La photo n'a pas pu être enregistrée..."})
            }
        })
        //si c'est good on retourne un json avec le nom de la photo vers le front
        res.json({status: 200, msg: "image bien enregistré!", url: req.files.image.name})
    })
    
    
    
    
    //route de modification d'une annonce
    app.put('/api/v1/ads/update/:id', async (req,res,next)=>{
        let id = req.params.id
        
        let modif = await db.query('UPDATE ads SET Title=?, Contents=? WHERE Id=?', [req.body.title, req.body.contents, id])
        
        if(modif.code){
            res.json({status: 500, error_msg: modif})
        }
        
        res.json({status: 200, msg: "Modification de l'annonce réussie!"})
    })
    
    //route de suppression d'une annonce
    app.delete('/api/v1/ads/delete/:id', async (req,res,next)=>{
        let id = req.params.id
        
        let supp = await db.query('DELETE FROM ads WHERE Id=?', [id])
        
        if(supp.code){
            res.json({status: 500, error_msg: supp})
        }
        
        res.json({status: 200, msg: "Annonce supprimée avec succés"})
    })
    
})
.catch(err=>console.log(err))

const PORT = process.env.PORT || 9500

app.listen(PORT, ()=>{
    console.log(`Serveur en écoute sur le port: ${PORT}. All is ok!`)
})