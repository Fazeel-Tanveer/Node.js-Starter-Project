var express = require('express');
var logger = require('morgan');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

var clientRouter = require('./Routes/Client/client.routes');
var adminRouter = require('./Routes/Admin/admin.routes');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const dbURI = process.env.dbURI;
const port = process.env.port;

mongoose
	.connect(dbURI, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log("Database Connected"))
	.catch((err) => console.log(err));

mongoose.Promise = global.Promise;

// Public Folder
app.use('/images', express.static('Uploads'))

// Routes
app.use('/client', clientRouter);
app.use('/admin', adminRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	res.status(err.status || 404).json({
		message: "No such route exists"
	})
});

// error handler
app.use(function (err, req, res, next) {
	res.status(err.status || 500).json({
		success: false,
		message: "Error"
	})
});

app.listen(port, () => console.log(`Server Is Running On Port: ${port}`))

module.exports = app;
