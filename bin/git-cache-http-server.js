#!/usr/bin/env node

// Generated by Haxe 4.1.0-rc.1+279f459a5
(function ($global) { "use strict";
var $estr = function() { return js_Boot.__string_rec(this,''); },$hxEnums = $hxEnums || {},$_;
function $extend(from, fields) {
	var proto = Object.create(from);
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var EReg = function(r,opt) {
	this.r = new RegExp(r,opt.split("u").join(""));
};
EReg.__name__ = true;
EReg.prototype = {
	match: function(s) {
		if(this.r.global) {
			this.r.lastIndex = 0;
		}
		this.r.m = this.r.exec(s);
		this.r.s = s;
		return this.r.m != null;
	}
	,matched: function(n) {
		if(this.r.m != null && n >= 0 && n < this.r.m.length) {
			return this.r.m[n];
		} else {
			throw new js__$Boot_HaxeError("EReg::matched");
		}
	}
};
var HttpsProxyAgent = require("http-proxy-agent");
var HxOverrides = function() { };
HxOverrides.__name__ = true;
HxOverrides.cca = function(s,index) {
	var x = s.charCodeAt(index);
	if(x != x) {
		return undefined;
	}
	return x;
};
HxOverrides.substr = function(s,pos,len) {
	if(len == null) {
		len = s.length;
	} else if(len < 0) {
		if(pos == 0) {
			len = s.length + len;
		} else {
			return "";
		}
	}
	return s.substr(pos,len);
};
var Main = function() { };
Main.__name__ = true;
Main.safeUser = function(basic) {
	var basic1 = basic.split(":");
	if(basic1.length != 2) {
		throw new js__$Boot_HaxeError("ERR: invalid Basic HTTP authentication");
	}
	var user = basic1[0];
	var pwd = basic1[1];
	if((user == pwd || pwd == "" || new EReg("oauth","").match(pwd)) && user.length > 5) {
		user = HxOverrides.substr(user,0,5) + "...";
	}
	return user;
};
Main.parseAuth = function(s) {
	if(s == null) {
		return null;
	}
	var parts = s.split(" ");
	if(parts[0] != "Basic") {
		throw new js__$Boot_HaxeError("ERR: HTTP authentication schemes other than Basic not supported");
	}
	return { authorization : s, basic : haxe_crypto_Base64.decode(parts[1]).toString()};
};
Main.getParams = function(req) {
	var r = new EReg("^/(.+)(.git)?/(info/refs\\?service=)?(git-[^-]+-pack)$","");
	if(!r.match(req.url)) {
		throw new js__$Boot_HaxeError("Cannot deal with url");
	}
	return { repo : r.matched(1), auth : Main.parseAuth(req.headers["authorization"]), service : r.matched(4), isInfoRequest : r.matched(3) != null};
};
Main.clone = function(remote,local,callback) {
	js_node_ChildProcess.exec("git clone --quiet --mirror \"" + remote + "\" \"" + local + "\"",callback);
};
Main.fetch = function(remote,local,callback) {
	js_node_ChildProcess.exec("git -C \"" + local + "\" remote set-url origin \"" + remote + "\"",function(err,stdout,stderr) {
		js_node_ChildProcess.exec("git -C \"" + local + "\" fetch --quiet",callback);
	});
};
Main.authenticate = function(params,infos,callback) {
	console.log("src/Main.hx:63:","INFO: authenticating on the upstream repo " + infos);
	var req;
	if(Main.proxyAgent == null) {
		req = js_node_Https.request("https://" + params.repo + "/info/refs?service=" + params.service,null,callback);
	} else {
		var opts = { };
		opts.protocol = "https:";
		opts.host = params.repo;
		opts.path = "/info/refs?service=" + params.service;
		opts.agent = Main.proxyAgent;
		req = js_node_Https.request(opts,callback);
	}
	req.setHeader("User-Agent","git/");
	if(params.auth != null) {
		req.setHeader("Authorization",params.auth.authorization);
	}
	req.end();
};
Main.update = function(remote,local,infos,callback) {
	if(!Object.prototype.hasOwnProperty.call(Main.updatePromises.h,local)) {
		var this1 = Main.updatePromises;
		var v = new Promise(function(resolve,reject) {
			console.log("src/Main.hx:87:","INFO: updating: fetching from " + infos);
			Main.fetch(remote,local,function(ferr,stdout,stderr) {
				if(ferr != null) {
					console.log("src/Main.hx:90:","WARN: updating: fetch failed");
					console.log("src/Main.hx:91:",stdout);
					console.log("src/Main.hx:92:",stderr);
					console.log("src/Main.hx:93:","WARN: continuing with clone");
					Main.clone(remote,local,function(cerr,stdout1,stderr1) {
						if(cerr != null) {
							console.log("src/Main.hx:96:",stdout1);
							console.log("src/Main.hx:97:",stderr1);
							resolve("ERR: git clone exited with non-zero status: " + cerr.code);
						} else {
							console.log("src/Main.hx:100:","INFO: updating via clone: success");
							resolve(null);
						}
					});
				} else {
					console.log("src/Main.hx:105:","INFO: updating via fetch: success");
					resolve(null);
				}
			});
		}).then(function(success) {
			var _this = Main.updatePromises;
			if(Object.prototype.hasOwnProperty.call(_this.h,local)) {
				delete(_this.h[local]);
			}
			return Promise.resolve(success);
		}).catch(function(err) {
			var _this1 = Main.updatePromises;
			if(Object.prototype.hasOwnProperty.call(_this1.h,local)) {
				delete(_this1.h[local]);
			}
			return Promise.reject(err);
		});
		this1.h[local] = v;
	} else {
		console.log("src/Main.hx:119:","INFO: reusing existing promise");
	}
	return Main.updatePromises.h[local].then(function(nothing) {
		console.log("src/Main.hx:123:","INFO: promise fulfilled");
		callback(null);
	},function(err1) {
		callback(err1);
	});
};
Main.handleRequest = function(req,res) {
	try {
		console.log("src/Main.hx:133:","" + req.method + " " + req.url);
		var params = Main.getParams(req);
		var infos = "" + params.repo;
		if(params.auth != null) {
			infos += " (user " + Main.safeUser(params.auth.basic) + ")";
		}
		var _g = params.isInfoRequest;
		var _g1 = req.method == "GET";
		if(_g1) {
			if(_g != true) {
				var m = _g1;
				var i = _g;
				throw new js__$Boot_HaxeError("isInfoRequest=" + (i == null ? "null" : "" + i) + " but isPOST=" + (m == null ? "null" : "" + m));
			}
		} else if(_g != false) {
			var m1 = _g1;
			var i1 = _g;
			throw new js__$Boot_HaxeError("isInfoRequest=" + (i1 == null ? "null" : "" + i1) + " but isPOST=" + (m1 == null ? "null" : "" + m1));
		}
		if(params.service != "git-upload-pack") {
			throw new js__$Boot_HaxeError("Service " + params.service + " not supported yet");
		}
		var remote = params.auth == null ? "https://" + params.repo : "https://" + params.auth.basic + "@" + params.repo;
		var local = js_node_Path.join(Main.cacheDir,params.repo);
		Main.authenticate(params,infos,function(upRes) {
			switch(upRes.statusCode) {
			case 200:
				break;
			case 401:case 403:case 404:
				res.writeHead(upRes.statusCode,upRes.headers);
				res.end();
				return;
			}
			if(params.isInfoRequest) {
				Main.update(remote,local,infos,function(err) {
					if(err != null) {
						console.log("src/Main.hx:165:","ERR: " + err);
						console.log("src/Main.hx:166:",haxe_CallStack.toString(haxe_CallStack.exceptionStack()));
						res.statusCode = 500;
						res.end();
						return;
					}
					res.statusCode = 200;
					res.setHeader("Content-Type","application/x-" + params.service + "-advertisement");
					res.setHeader("Cache-Control","no-cache");
					res.write("001e# service=git-upload-pack\n0000");
					var up = js_node_ChildProcess.spawn(params.service,["--stateless-rpc","--advertise-refs",local]);
					up.stdout.pipe(res);
					up.stderr.on("data",function(data) {
						console.log("src/Main.hx:177:","" + params.service + " stderr: " + data);
					});
					up.on("exit",function(code) {
						if(code != 0) {
							res.end();
						}
						console.log("src/Main.hx:181:","INFO: " + params.service + " done with exit " + code);
					});
				});
			} else {
				res.statusCode = 200;
				res.setHeader("Content-Type","application/x-" + params.service + "-result");
				res.setHeader("Cache-Control","no-cache");
				var up1 = js_node_ChildProcess.spawn(params.service,["--stateless-rpc",local]);
				if(req.headers["content-encoding"] == "gzip") {
					var tmp = js_node_Zlib.createUnzip();
					req.pipe(tmp).pipe(up1.stdin);
				} else {
					req.pipe(up1.stdin);
				}
				up1.stdout.pipe(res);
				up1.stderr.on("data",function(data1) {
					console.log("src/Main.hx:195:","" + params.service + " stderr: " + data1);
				});
				up1.on("exit",function(code1) {
					if(code1 != 0) {
						res.end();
					}
					console.log("src/Main.hx:199:","" + params.service + " done with exit " + code1);
				});
			}
		});
	} catch( err1 ) {
		haxe_CallStack.lastException = err1;
		console.log("src/Main.hx:204:","ERROR: " + Std.string(((err1) instanceof js__$Boot_HaxeError) ? err1.val : err1));
		console.log("src/Main.hx:205:",haxe_CallStack.toString(haxe_CallStack.exceptionStack()));
		res.statusCode = 500;
		res.end();
	}
};
Main.main = function() {
	var options = js_npm_Docopt.docopt(Main.usage,{ version : "0.0.2"});
	Main.cacheDir = options["--cache-dir"];
	Main.listenPort = Std.parseInt(options["--port"]);
	if(Main.listenPort == null || Main.listenPort < 1 || Main.listenPort > 65535) {
		throw new js__$Boot_HaxeError("Invalid port number: " + Std.string(options["--port"]));
	}
	console.log("src/Main.hx:238:","INFO: cache directory: " + Main.cacheDir);
	console.log("src/Main.hx:239:","INFO: listening to port: " + Main.listenPort);
	var env = Sys.environment();
	var proxyUrl = env.h["http_proxy"];
	if(proxyUrl == null) {
		proxyUrl = env.h["HTTP_PROXY"];
	}
	if(proxyUrl != null) {
		Main.proxyAgent = new HttpsProxyAgent(proxyUrl);
	}
	var server = js_node_Http.createServer(Main.handleRequest);
	server.setTimeout(7200000);
	server.listen(Main.listenPort);
};
Math.__name__ = true;
var Reflect = function() { };
Reflect.__name__ = true;
Reflect.fields = function(o) {
	var a = [];
	if(o != null) {
		var hasOwnProperty = Object.prototype.hasOwnProperty;
		for( var f in o ) {
		if(f != "__id__" && f != "hx__closures__" && hasOwnProperty.call(o,f)) {
			a.push(f);
		}
		}
	}
	return a;
};
var Std = function() { };
Std.__name__ = true;
Std.string = function(s) {
	return js_Boot.__string_rec(s,"");
};
Std.parseInt = function(x) {
	if(x != null) {
		var _g = 0;
		var _g1 = x.length;
		while(_g < _g1) {
			var i = _g++;
			var c = x.charCodeAt(i);
			if(c <= 8 || c >= 14 && c != 32 && c != 45) {
				var nc = x.charCodeAt(i + 1);
				var v = parseInt(x,nc == 120 || nc == 88 ? 16 : 10);
				if(isNaN(v)) {
					return null;
				} else {
					return v;
				}
			}
		}
	}
	return null;
};
var StringBuf = function() {
	this.b = "";
};
StringBuf.__name__ = true;
var StringTools = function() { };
StringTools.__name__ = true;
StringTools.isSpace = function(s,pos) {
	var c = HxOverrides.cca(s,pos);
	if(!(c > 8 && c < 14)) {
		return c == 32;
	} else {
		return true;
	}
};
StringTools.ltrim = function(s) {
	var l = s.length;
	var r = 0;
	while(r < l && StringTools.isSpace(s,r)) ++r;
	if(r > 0) {
		return HxOverrides.substr(s,r,l - r);
	} else {
		return s;
	}
};
StringTools.rtrim = function(s) {
	var l = s.length;
	var r = 0;
	while(r < l && StringTools.isSpace(s,l - r - 1)) ++r;
	if(r > 0) {
		return HxOverrides.substr(s,0,l - r);
	} else {
		return s;
	}
};
StringTools.trim = function(s) {
	return StringTools.ltrim(StringTools.rtrim(s));
};
var Sys = function() { };
Sys.__name__ = true;
Sys.environment = function() {
	var m = new haxe_ds_StringMap();
	var _g = 0;
	var _g1 = Reflect.fields(process.env);
	while(_g < _g1.length) {
		var key = _g1[_g];
		++_g;
		var v = process.env[key];
		m.h[key] = v;
	}
	return m;
};
var haxe_io_Output = function() { };
haxe_io_Output.__name__ = true;
var _$Sys_FileOutput = function(fd) {
	this.fd = fd;
};
_$Sys_FileOutput.__name__ = true;
_$Sys_FileOutput.__super__ = haxe_io_Output;
_$Sys_FileOutput.prototype = $extend(haxe_io_Output.prototype,{
	writeByte: function(c) {
		js_node_Fs.writeSync(this.fd,String.fromCodePoint(c));
	}
	,writeBytes: function(s,pos,len) {
		var data = s.b;
		return js_node_Fs.writeSync(this.fd,js_node_buffer_Buffer.from(data.buffer,data.byteOffset,s.length),pos,len);
	}
	,writeString: function(s,encoding) {
		js_node_Fs.writeSync(this.fd,s);
	}
	,flush: function() {
		js_node_Fs.fsyncSync(this.fd);
	}
	,close: function() {
		js_node_Fs.closeSync(this.fd);
	}
});
var haxe_io_Input = function() { };
haxe_io_Input.__name__ = true;
var _$Sys_FileInput = function(fd) {
	this.fd = fd;
};
_$Sys_FileInput.__name__ = true;
_$Sys_FileInput.__super__ = haxe_io_Input;
_$Sys_FileInput.prototype = $extend(haxe_io_Input.prototype,{
	readByte: function() {
		var buf = js_node_buffer_Buffer.alloc(1);
		try {
			js_node_Fs.readSync(this.fd,buf,0,1,null);
		} catch( e ) {
			haxe_CallStack.lastException = e;
			var e1 = ((e) instanceof js__$Boot_HaxeError) ? e.val : e;
			if(e1.code == "EOF") {
				throw new js__$Boot_HaxeError(new haxe_io_Eof());
			} else {
				throw new js__$Boot_HaxeError(haxe_io_Error.Custom(e1));
			}
		}
		return buf[0];
	}
	,readBytes: function(s,pos,len) {
		var data = s.b;
		var buf = js_node_buffer_Buffer.from(data.buffer,data.byteOffset,s.length);
		try {
			return js_node_Fs.readSync(this.fd,buf,pos,len,null);
		} catch( e ) {
			haxe_CallStack.lastException = e;
			var e1 = ((e) instanceof js__$Boot_HaxeError) ? e.val : e;
			if(e1.code == "EOF") {
				throw new js__$Boot_HaxeError(new haxe_io_Eof());
			} else {
				throw new js__$Boot_HaxeError(haxe_io_Error.Custom(e1));
			}
		}
	}
	,close: function() {
		js_node_Fs.closeSync(this.fd);
	}
});
var Version = function() { };
Version.__name__ = true;
var haxe_StackItem = $hxEnums["haxe.StackItem"] = { __ename__ : true, __constructs__ : ["CFunction","Module","FilePos","Method","LocalFunction"]
	,CFunction: {_hx_index:0,__enum__:"haxe.StackItem",toString:$estr}
	,Module: ($_=function(m) { return {_hx_index:1,m:m,__enum__:"haxe.StackItem",toString:$estr}; },$_.__params__ = ["m"],$_)
	,FilePos: ($_=function(s,file,line,column) { return {_hx_index:2,s:s,file:file,line:line,column:column,__enum__:"haxe.StackItem",toString:$estr}; },$_.__params__ = ["s","file","line","column"],$_)
	,Method: ($_=function(classname,method) { return {_hx_index:3,classname:classname,method:method,__enum__:"haxe.StackItem",toString:$estr}; },$_.__params__ = ["classname","method"],$_)
	,LocalFunction: ($_=function(v) { return {_hx_index:4,v:v,__enum__:"haxe.StackItem",toString:$estr}; },$_.__params__ = ["v"],$_)
};
var haxe_CallStack = function() { };
haxe_CallStack.__name__ = true;
haxe_CallStack.getStack = function(e) {
	if(e == null) {
		return [];
	}
	var oldValue = Error.prepareStackTrace;
	Error.prepareStackTrace = function(error,callsites) {
		var stack = [];
		var _g = 0;
		while(_g < callsites.length) {
			var site = callsites[_g];
			++_g;
			if(haxe_CallStack.wrapCallSite != null) {
				site = haxe_CallStack.wrapCallSite(site);
			}
			var method = null;
			var fullName = site.getFunctionName();
			if(fullName != null) {
				var idx = fullName.lastIndexOf(".");
				if(idx >= 0) {
					var className = HxOverrides.substr(fullName,0,idx);
					var methodName = HxOverrides.substr(fullName,idx + 1,null);
					method = haxe_StackItem.Method(className,methodName);
				}
			}
			var fileName = site.getFileName();
			var fileAddr = fileName == null ? -1 : fileName.indexOf("file:");
			if(haxe_CallStack.wrapCallSite != null && fileAddr > 0) {
				fileName = HxOverrides.substr(fileName,fileAddr + 6,null);
			}
			stack.push(haxe_StackItem.FilePos(method,fileName,site.getLineNumber(),site.getColumnNumber()));
		}
		return stack;
	};
	var a = haxe_CallStack.makeStack(e.stack);
	Error.prepareStackTrace = oldValue;
	return a;
};
haxe_CallStack.exceptionStack = function() {
	return haxe_CallStack.getStack(haxe_CallStack.lastException);
};
haxe_CallStack.toString = function(stack) {
	var b = new StringBuf();
	var _g = 0;
	while(_g < stack.length) {
		var s = stack[_g];
		++_g;
		b.b += "\nCalled from ";
		haxe_CallStack.itemToString(b,s);
	}
	return b.b;
};
haxe_CallStack.itemToString = function(b,s) {
	switch(s._hx_index) {
	case 0:
		b.b += "a C function";
		break;
	case 1:
		var m = s.m;
		b.b += "module ";
		b.b += m == null ? "null" : "" + m;
		break;
	case 2:
		var col = s.column;
		var line = s.line;
		var file = s.file;
		var s1 = s.s;
		if(s1 != null) {
			haxe_CallStack.itemToString(b,s1);
			b.b += " (";
		}
		b.b += file == null ? "null" : "" + file;
		b.b += " line ";
		b.b += line == null ? "null" : "" + line;
		if(col != null) {
			b.b += " column ";
			b.b += col == null ? "null" : "" + col;
		}
		if(s1 != null) {
			b.b += ")";
		}
		break;
	case 3:
		var meth = s.method;
		var cname = s.classname;
		b.b += Std.string(cname == null ? "<unknown>" : cname);
		b.b += ".";
		b.b += meth == null ? "null" : "" + meth;
		break;
	case 4:
		var n = s.v;
		b.b += "local function #";
		b.b += n == null ? "null" : "" + n;
		break;
	}
};
haxe_CallStack.makeStack = function(s) {
	if(s == null) {
		return [];
	} else if(typeof(s) == "string") {
		var stack = s.split("\n");
		if(stack[0] == "Error") {
			stack.shift();
		}
		var m = [];
		var rie10 = new EReg("^   at ([A-Za-z0-9_. ]+) \\(([^)]+):([0-9]+):([0-9]+)\\)$","");
		var _g = 0;
		while(_g < stack.length) {
			var line = stack[_g];
			++_g;
			if(rie10.match(line)) {
				var path = rie10.matched(1).split(".");
				var meth = path.pop();
				var file = rie10.matched(2);
				var line1 = Std.parseInt(rie10.matched(3));
				var column = Std.parseInt(rie10.matched(4));
				m.push(haxe_StackItem.FilePos(meth == "Anonymous function" ? haxe_StackItem.LocalFunction() : meth == "Global code" ? null : haxe_StackItem.Method(path.join("."),meth),file,line1,column));
			} else {
				m.push(haxe_StackItem.Module(StringTools.trim(line)));
			}
		}
		return m;
	} else {
		return s;
	}
};
var haxe_io_Bytes = function(data) {
	this.length = data.byteLength;
	this.b = new Uint8Array(data);
	this.b.bufferValue = data;
	data.hxBytes = this;
	data.bytes = this.b;
};
haxe_io_Bytes.__name__ = true;
haxe_io_Bytes.ofString = function(s,encoding) {
	if(encoding == haxe_io_Encoding.RawNative) {
		var buf = new Uint8Array(s.length << 1);
		var _g = 0;
		var _g1 = s.length;
		while(_g < _g1) {
			var i = _g++;
			var c = s.charCodeAt(i);
			buf[i << 1] = c & 255;
			buf[i << 1 | 1] = c >> 8;
		}
		return new haxe_io_Bytes(buf.buffer);
	}
	var a = [];
	var i1 = 0;
	while(i1 < s.length) {
		var c1 = s.charCodeAt(i1++);
		if(55296 <= c1 && c1 <= 56319) {
			c1 = c1 - 55232 << 10 | s.charCodeAt(i1++) & 1023;
		}
		if(c1 <= 127) {
			a.push(c1);
		} else if(c1 <= 2047) {
			a.push(192 | c1 >> 6);
			a.push(128 | c1 & 63);
		} else if(c1 <= 65535) {
			a.push(224 | c1 >> 12);
			a.push(128 | c1 >> 6 & 63);
			a.push(128 | c1 & 63);
		} else {
			a.push(240 | c1 >> 18);
			a.push(128 | c1 >> 12 & 63);
			a.push(128 | c1 >> 6 & 63);
			a.push(128 | c1 & 63);
		}
	}
	return new haxe_io_Bytes(new Uint8Array(a).buffer);
};
haxe_io_Bytes.prototype = {
	getString: function(pos,len,encoding) {
		if(pos < 0 || len < 0 || pos + len > this.length) {
			throw new js__$Boot_HaxeError(haxe_io_Error.OutsideBounds);
		}
		if(encoding == null) {
			encoding = haxe_io_Encoding.UTF8;
		}
		var s = "";
		var b = this.b;
		var i = pos;
		var max = pos + len;
		switch(encoding._hx_index) {
		case 0:
			var debug = pos > 0;
			while(i < max) {
				var c = b[i++];
				if(c < 128) {
					if(c == 0) {
						break;
					}
					s += String.fromCodePoint(c);
				} else if(c < 224) {
					var code = (c & 63) << 6 | b[i++] & 127;
					s += String.fromCodePoint(code);
				} else if(c < 240) {
					var c2 = b[i++];
					var code1 = (c & 31) << 12 | (c2 & 127) << 6 | b[i++] & 127;
					s += String.fromCodePoint(code1);
				} else {
					var c21 = b[i++];
					var c3 = b[i++];
					var u = (c & 15) << 18 | (c21 & 127) << 12 | (c3 & 127) << 6 | b[i++] & 127;
					s += String.fromCodePoint(u);
				}
			}
			break;
		case 1:
			while(i < max) {
				var c1 = b[i++] | b[i++] << 8;
				s += String.fromCodePoint(c1);
			}
			break;
		}
		return s;
	}
	,toString: function() {
		return this.getString(0,this.length);
	}
};
var haxe_io_Encoding = $hxEnums["haxe.io.Encoding"] = { __ename__ : true, __constructs__ : ["UTF8","RawNative"]
	,UTF8: {_hx_index:0,__enum__:"haxe.io.Encoding",toString:$estr}
	,RawNative: {_hx_index:1,__enum__:"haxe.io.Encoding",toString:$estr}
};
var haxe_crypto_Base64 = function() { };
haxe_crypto_Base64.__name__ = true;
haxe_crypto_Base64.decode = function(str,complement) {
	if(complement == null) {
		complement = true;
	}
	if(complement) {
		while(HxOverrides.cca(str,str.length - 1) == 61) str = HxOverrides.substr(str,0,-1);
	}
	return new haxe_crypto_BaseCode(haxe_crypto_Base64.BYTES).decodeBytes(haxe_io_Bytes.ofString(str));
};
var haxe_crypto_BaseCode = function(base) {
	var len = base.length;
	var nbits = 1;
	while(len > 1 << nbits) ++nbits;
	if(nbits > 8 || len != 1 << nbits) {
		throw new js__$Boot_HaxeError("BaseCode : base length must be a power of two.");
	}
	this.base = base;
	this.nbits = nbits;
};
haxe_crypto_BaseCode.__name__ = true;
haxe_crypto_BaseCode.prototype = {
	initTable: function() {
		var tbl = [];
		var _g = 0;
		while(_g < 256) {
			var i = _g++;
			tbl[i] = -1;
		}
		var _g1 = 0;
		var _g2 = this.base.length;
		while(_g1 < _g2) {
			var i1 = _g1++;
			tbl[this.base.b[i1]] = i1;
		}
		this.tbl = tbl;
	}
	,decodeBytes: function(b) {
		var nbits = this.nbits;
		var base = this.base;
		if(this.tbl == null) {
			this.initTable();
		}
		var tbl = this.tbl;
		var size = b.length * nbits >> 3;
		var out = new haxe_io_Bytes(new ArrayBuffer(size));
		var buf = 0;
		var curbits = 0;
		var pin = 0;
		var pout = 0;
		while(pout < size) {
			while(curbits < 8) {
				curbits += nbits;
				buf <<= nbits;
				var i = tbl[b.b[pin++]];
				if(i == -1) {
					throw new js__$Boot_HaxeError("BaseCode : invalid encoded char");
				}
				buf |= i;
			}
			curbits -= 8;
			out.b[pout++] = buf >> curbits & 255;
		}
		return out;
	}
};
var haxe_ds_StringMap = function() {
	this.h = Object.create(null);
};
haxe_ds_StringMap.__name__ = true;
var haxe_io_Eof = function() {
};
haxe_io_Eof.__name__ = true;
haxe_io_Eof.prototype = {
	toString: function() {
		return "Eof";
	}
};
var haxe_io_Error = $hxEnums["haxe.io.Error"] = { __ename__ : true, __constructs__ : ["Blocked","Overflow","OutsideBounds","Custom"]
	,Blocked: {_hx_index:0,__enum__:"haxe.io.Error",toString:$estr}
	,Overflow: {_hx_index:1,__enum__:"haxe.io.Error",toString:$estr}
	,OutsideBounds: {_hx_index:2,__enum__:"haxe.io.Error",toString:$estr}
	,Custom: ($_=function(e) { return {_hx_index:3,e:e,__enum__:"haxe.io.Error",toString:$estr}; },$_.__params__ = ["e"],$_)
};
var js__$Boot_HaxeError = function(val) {
	Error.call(this);
	this.val = val;
	if(Error.captureStackTrace) {
		Error.captureStackTrace(this,js__$Boot_HaxeError);
	}
};
js__$Boot_HaxeError.__name__ = true;
js__$Boot_HaxeError.__super__ = Error;
js__$Boot_HaxeError.prototype = $extend(Error.prototype,{
});
var js_Boot = function() { };
js_Boot.__name__ = true;
js_Boot.__string_rec = function(o,s) {
	if(o == null) {
		return "null";
	}
	if(s.length >= 5) {
		return "<...>";
	}
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) {
		t = "object";
	}
	switch(t) {
	case "function":
		return "<function>";
	case "object":
		if(o.__enum__) {
			var e = $hxEnums[o.__enum__];
			var n = e.__constructs__[o._hx_index];
			var con = e[n];
			if(con.__params__) {
				s = s + "\t";
				return n + "(" + ((function($this) {
					var $r;
					var _g = [];
					{
						var _g1 = 0;
						var _g2 = con.__params__;
						while(true) {
							if(!(_g1 < _g2.length)) {
								break;
							}
							var p = _g2[_g1];
							_g1 = _g1 + 1;
							_g.push(js_Boot.__string_rec(o[p],s));
						}
					}
					$r = _g;
					return $r;
				}(this))).join(",") + ")";
			} else {
				return n;
			}
		}
		if(((o) instanceof Array)) {
			var str = "[";
			s += "\t";
			var _g3 = 0;
			var _g11 = o.length;
			while(_g3 < _g11) {
				var i = _g3++;
				str += (i > 0 ? "," : "") + js_Boot.__string_rec(o[i],s);
			}
			str += "]";
			return str;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e1 ) {
			haxe_CallStack.lastException = e1;
			var e2 = ((e1) instanceof js__$Boot_HaxeError) ? e1.val : e1;
			return "???";
		}
		if(tostr != null && tostr != Object.toString && typeof(tostr) == "function") {
			var s2 = o.toString();
			if(s2 != "[object Object]") {
				return s2;
			}
		}
		var str1 = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		var k = null;
		for( k in o ) {
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str1.length != 2) {
			str1 += ", \n";
		}
		str1 += s + k + " : " + js_Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str1 += "\n" + s + "}";
		return str1;
	case "string":
		return o;
	default:
		return String(o);
	}
};
var js_node_ChildProcess = require("child_process");
var js_node_Fs = require("fs");
var js_node_Http = require("http");
var js_node_Https = require("https");
var js_node_KeyValue = {};
js_node_KeyValue.get_key = function(this1) {
	return this1[0];
};
js_node_KeyValue.get_value = function(this1) {
	return this1[1];
};
var js_node_Path = require("path");
var js_node_Zlib = require("zlib");
var js_node_buffer_Buffer = require("buffer").Buffer;
var js_node_stream_WritableNewOptionsAdapter = {};
js_node_stream_WritableNewOptionsAdapter.from = function(options) {
	if(!Object.prototype.hasOwnProperty.call(options,"final")) {
		Object.defineProperty(options,"final",{ get : function() {
			return options.final_;
		}});
	}
	return options;
};
var js_node_url_URLSearchParamsEntry = {};
js_node_url_URLSearchParamsEntry._new = function(name,value) {
	var this1 = [name,value];
	return this1;
};
js_node_url_URLSearchParamsEntry.get_name = function(this1) {
	return this1[0];
};
js_node_url_URLSearchParamsEntry.get_value = function(this1) {
	return this1[1];
};
var js_npm_Docopt = require("docopt");
if( String.fromCodePoint == null ) String.fromCodePoint = function(c) { return c < 0x10000 ? String.fromCharCode(c) : String.fromCharCode((c>>10)+0xD7C0)+String.fromCharCode((c&0x3FF)+0xDC00); }
String.__name__ = true;
Array.__name__ = true;
try{Object.defineProperty(js__$Boot_HaxeError.prototype, "message", {get: function(){return String(this.val)}})}catch(e){}
js_Boot.__toStr = ({ }).toString;
Main.updatePromises = new haxe_ds_StringMap();
Main.cacheDir = "/tmp/var/cache/git/";
Main.listenPort = 8080;
Main.usage = "\nA caching Git HTTP server.\n\nServe local mirror repositories over HTTP/HTTPS, updating them as they are requested.\n\nUsage:\n  git-cache-http-server.js [options]\n\nOptions:\n  -c,--cache-dir <path>   Location of the git cache [default: /var/cache/git]\n  -p,--port <port>        Bind to port [default: 8080]\n  -h,--help               Print this message\n  --version               Print the current version\n";
haxe_crypto_Base64.CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
haxe_crypto_Base64.BYTES = haxe_io_Bytes.ofString(haxe_crypto_Base64.CHARS);
Main.main();
})({});
