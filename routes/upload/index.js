/**
 *   @Author huangjq
 *   @createDate 2020/06/10
 */
let express = require('express')
let router = express.Router()
let multipart = require('connect-multiparty')
let multipartMiddleware = multipart()
let fs = require('fs')
let UUID = require('node-uuid')
const fileBasePath='./uploadFiles/'
// let {Utils, DbUtilsClass, ResponseResult} = require('../commons')
// let DbUtils = new DbUtilsClass('t_upload_file')

//上传图片
//http://localhost:3000/files/upload
router.post('/upload', multipartMiddleware, function (req, res, next) {
	let file = req.files.multipartFiles
	let originalFilename = file.originalFilename
	let suffix = originalFilename.substr(originalFilename.lastIndexOf('.'))
	let fileRealName = UUID.v4().replace(/-/g, '') + suffix
	console.log(file.name) // 上传的文件信息
	
	let des_file = fileBasePath + fileRealName
	fs.readFile(file.path, function (err, data) {
		fs.writeFile(des_file, data, function (err) {
			if (err) {
				console.log(err)
			} else {
				response = {
					message: 'File uploaded successfully',
					filename: {
						originalName: file.name,
						realName: fileRealName
					},
					filePath: `/files/${fileRealName}`
				}
				console.log(response)
				res.end(JSON.stringify(response))
			}
		})
	})
})

//预览图片
//http://localhost:3000/files/88f4aee556664b32922893235a062cd9.png
router.get('/:fileName', function (req, res, next) {
	let filePath = fileBasePath + req.params.fileName;
	fs.readFile(filePath, function (isErr, data) {
		if (isErr) {
			res.end('Read file failed!')
			return
		}
		res.end(data)
	})
})

//下载图片
//http://localhost:3000/files/download/88f4aee556664b32922893235a062cd9.png?displayName=adasda
router.get('/download/:fileName', function (req, res, next) {
	let displayName = req.param('displayName')
	let filePath = fileBasePath + req.params.fileName;
	fs.readFile(filePath, function (isErr, data) {
		if (isErr) {
			res.end('Read file failed!')
			return
		}
		res.writeHead(200, {
			'Content-Type': 'application/octet-stream', //告诉浏览器这是一个二进制文件
			'Content-Disposition': 'attachment; filename=' + displayName //告诉浏览器这是一个需要下载的文件
		})
		res.end(data)
	})
})
// router.post('/delete/:id', function (req, res, next) {
// 	DbUtils;
// 	DbUtils.queryObj({id: req.params.id}, 't_upload_file').then(result => {
// 		return DbUtils.delete({id: req.params.id}, 't_upload_file')
// 			.then(function (result1) {
// 				fs.unlink(`./upload/${result.realName}`,function(error){
// 					if(error){
// 						console.log(error);
// 						return false;
// 					}
// 					res.end(ResponseResult.success())
// 				})
// 			})
// 	})
// 		.catch(() => {
// 			res.end(ResponseResult.fail())
// 		})
// })

module.exports = router
