var express = require('express')
var fileUpload = require ('express-fileupload')
var path =  require('path')
var d = Date(Date.now()).toString()
var serverIndex = require('serve-index')

const app = express()

app.use(
    fileUpload({
        useTempFiles : false,
        tempFileDir : path.join(__dirname,'tmp'),
    })
)

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
})

app.post('/', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        console.log(d + ' No files were selected for upload ...')
        return res.status(400).send('No files were selected for upload ...')
    }

    let targetFile = req.files.target_file;

    targetFile.mv(path.join(__dirname, 'store', targetFile.name), (err) => {
        if (err) {
            console.log(d + err)
           return res.status(500).send(err)
        }
        console.log(d + " File " + targetFile.name + " uploaded successfuly")
        res.sendFile(path.join(__dirname, 'success.html'))
    })
})

app.use('/store', express.static('store'), serverIndex('store', {'icons': true}))
 
app.listen(8080, () => console.log( d+' Simple static file server started and listening on port 8080'))
