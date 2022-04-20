const bcrypt = require("bcrypt");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const Staff = require("../../Models/staff");
const fs = require("fs");
const path = require('path');


exports.create = async (req, res, next) => {
	try {
		const staff = await Staff.findOne({ email: req.body.email })
		if (staff) {
			return res.status(409).json({
				success: false,
				message: "Email Already Exists."
			})
		}
		bcrypt.hash(req.body.password, 10, (err, hash) => {
			if (err) {
				return res.status(500).json({
					success: false,
					message: err
				});
			}

			let image = ''

			if (req.file) {
				image = path.join('images', req.file.filename)
			}

			let data = {
				email: req.body.email,
				password: hash,
				name: req.body.name
			}

			if (req.body.phone_number) {
				data.phone_number = req.body.phone_number
			}

			if (image) {
				data.image = image
			}

			Staff.create({
				email: req.body.email,
				password: hash,
				name: req.body.name,
				phone_number: req.body.phone_number,
				image
			}, (error, result) => {
				if (error) {
					return res.status(500).json({
						success: false,
						message: error
					});
				}
				return res.status(201).json({
					success: true,
					message: "Staff Created Successfully.",
					staff: {
						_id: result._id,
						email: result.email,
						name: result.name,
						phone_number: result.phone_number,
						image: result.image
					},
				})
			});
		})
	}
	catch (error) {
		return res.status(500).json({
			success: false,
			message: error
		});
	}
}

exports.get = async (req, res, next) => {
	try {
		const { _id } = req.params
		if (_id) {
			const staff = await Staff.findOne({ _id }, { __v: 0, password: 0 })
			if (staff) {
				return res.status(201).json({
					success: true,
					message: "Staff Fetched Successfully.",
					staff
				})
			}
		}
		return res.status(409).json({
			success: false,
			message: "Staff Not Found."
		})

	}
	catch (error) {
		return res.status(500).json({
			success: false,
			message: error
		});
	}
}

exports.list = async (req, res, next) => {
	try {

		let { page = 1, limit = 10 } = req.query
		page = parseInt(page)
		limit = parseInt(limit)

		if (page && limit) {
			let total = await Staff.countDocuments({})
			const users = await Staff.find({}, { __v: 0, password: 0 })
				.sort({ _id: -1 })
				.limit(limit)
				.skip((page - 1) * limit)

			total = total / limit
			if ((Math.abs(total) - Math.floor(total)) > 0) {
				total = parseInt(total)
				total += 1
			}

			return res.status(201).json({
				success: true,
				message: "Staff Fetched Successfully.",
				users,
				pagination: {
					page,
					limit,
					total
				}
			})
		}
		return res.status(500).json({
			success: false,
			message: "Something Went Wrong, Try Again."
		});
	}
	catch (error) {
		return res.status(500).json({
			success: false,
			message: error
		});
	}
}

exports.delete = async (req, res, next) => {
	try {
		const { _id } = req.params
		if (_id) {
			const staff = await Staff.findOneAndDelete({ _id })
			if (staff) {
				if (staff.image) {
					const imagePath = staff.image.split('/')
					fs.unlinkSync(path.join(__dirname, '../../', 'Uploads', imagePath[1]))
				}
				return res.status(201).json({
					success: true,
					message: "Staff Deleted Successfully.",
					staff: {
						_id: staff._id,
						email: staff.email,
						name: staff.name,
						phone_number: staff.phone_number,
						image: staff.image
					}
				})
			}
		}
		return res.status(409).json({
			success: false,
			message: "Staff Not Found."
		})
	}
	catch (error) {
		return res.status(500).json({
			success: false,
			message: error
		});
	}
}

exports.update = async (req, res, next) => {
	try {
		let { _id, name, email, password, prevPassword, phone_number } = req.body
		if (_id) {

			let data = {}

			if (email) {
				const staff = await Staff.findOne({ email })
				if (staff) {
					return res.status(409).json({
						success: false,
						message: "Email Already Exists."
					})
				}
				data.email = email
			}

			if (name) {
				data.name = name
			}

			if (phone_number) {
				data.phone_number = phone_number
			}

			if (prevPassword) {
				if (password) {
					const staff = await Staff.findOne({ _id })
					const result = await bcrypt.compare(prevPassword, staff.password)
					if (result) {
						data.password = await bcrypt.hash(password, 10)
					}
					else {
						return res.status(409).json({
							success: false,
							message: "Previous Password Is Incorrect."
						})
					}
				}
				else {
					return res.status(409).json({
						success: false,
						message: "Password Field Required."
					})
				}
			}

			if (req.file) {
				data.image = path.join('images', req.file.filename)
			}

			const staff = await Staff.findOneAndUpdate({ _id },
				{
					$set: data
				}, { useFindAndModify: false })

			if (staff) {
				if (staff.image) {
					const imagePath = staff.image.split('/')
					fs.unlinkSync(path.join(__dirname, '../../', 'Uploads', imagePath[1]))
				}
				return res.status(201).json({
					success: true,
					message: "Staff Updated Successfully.",
				})
			}
		}

		return res.status(409).json({
			success: false,
			message: "Staff Not Found."
		})

	}
	catch (error) {
		return res.status(500).json({
			success: false,
			message: error
		});
	}
}

exports.userLogin = async(req, res, next) => {

	const staff = await Staff.findOne({ email: req.body.email })
	console.log(staff)
	if (!staff) {
		return res.status(401).json({
			success: false,
			message: "Auth failed: Email not found probably",
		});
	}

	bcrypt.compare(req.body.password, staff.password, (err, result) => {
		if (err) {
			return res.status(401).json({
				message: "Auth failed",
			});
		}
		if (result) {
			const token = jwt.sign(
				{
					userId: staff._id,
					email: staff.email,
					name: staff.name,
					phone_number: staff.phone_number,
				},
				process.env.jwtSecret,
				{
					expiresIn: "1d",
				}
			);
			return res.status(200).json({
				message: "Auth successful",
				userDetails: {
					userId: staff._id,
					name: staff.name,
					email: staff.email,
					phone_number: staff.phone_number,
				},
				token: token,
			});
		}
		res.status(401).json({
			message: "Auth failed",
		});
	});
}

exports.author = async (req, res) => {
	const userId = req.user.userId;
	const staff = await Staff.findById(userId);
	if (staff) {
		res.status(200).json({
			success: true,
			message: "Found",
			staff,
		});
	} else {
		res.status(400).json({
			success: false,
			message: "Bad request",
		});
	}
};


