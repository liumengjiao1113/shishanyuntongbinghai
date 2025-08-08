if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  function requireNativePlugin(name) {
    return weex.requireModule(name);
  }
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  function int2char(n) {
    return BI_RM.charAt(n);
  }
  function op_and(x, y) {
    return x & y;
  }
  function op_or(x, y) {
    return x | y;
  }
  function op_xor(x, y) {
    return x ^ y;
  }
  function op_andnot(x, y) {
    return x & ~y;
  }
  function lbit(x) {
    if (x == 0) {
      return -1;
    }
    var r = 0;
    if ((x & 65535) == 0) {
      x >>= 16;
      r += 16;
    }
    if ((x & 255) == 0) {
      x >>= 8;
      r += 8;
    }
    if ((x & 15) == 0) {
      x >>= 4;
      r += 4;
    }
    if ((x & 3) == 0) {
      x >>= 2;
      r += 2;
    }
    if ((x & 1) == 0) {
      ++r;
    }
    return r;
  }
  function cbit(x) {
    var r = 0;
    while (x != 0) {
      x &= x - 1;
      ++r;
    }
    return r;
  }
  var b64map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var b64pad = "=";
  function hex2b64(h) {
    var i;
    var c;
    var ret = "";
    for (i = 0; i + 3 <= h.length; i += 3) {
      c = parseInt(h.substring(i, i + 3), 16);
      ret += b64map.charAt(c >> 6) + b64map.charAt(c & 63);
    }
    if (i + 1 == h.length) {
      c = parseInt(h.substring(i, i + 1), 16);
      ret += b64map.charAt(c << 2);
    } else if (i + 2 == h.length) {
      c = parseInt(h.substring(i, i + 2), 16);
      ret += b64map.charAt(c >> 2) + b64map.charAt((c & 3) << 4);
    }
    while ((ret.length & 3) > 0) {
      ret += b64pad;
    }
    return ret;
  }
  function b64tohex(s) {
    var ret = "";
    var i;
    var k = 0;
    var slop = 0;
    for (i = 0; i < s.length; ++i) {
      if (s.charAt(i) == b64pad) {
        break;
      }
      var v = b64map.indexOf(s.charAt(i));
      if (v < 0) {
        continue;
      }
      if (k == 0) {
        ret += int2char(v >> 2);
        slop = v & 3;
        k = 1;
      } else if (k == 1) {
        ret += int2char(slop << 2 | v >> 4);
        slop = v & 15;
        k = 2;
      } else if (k == 2) {
        ret += int2char(slop);
        ret += int2char(v >> 2);
        slop = v & 3;
        k = 3;
      } else {
        ret += int2char(slop << 2 | v >> 4);
        ret += int2char(v & 15);
        k = 0;
      }
    }
    if (k == 1) {
      ret += int2char(slop << 2);
    }
    return ret;
  }
  var decoder$1;
  var Hex = {
    decode: function(a) {
      var i;
      if (decoder$1 === void 0) {
        var hex = "0123456789ABCDEF";
        var ignore = " \f\n\r	 \u2028\u2029";
        decoder$1 = {};
        for (i = 0; i < 16; ++i) {
          decoder$1[hex.charAt(i)] = i;
        }
        hex = hex.toLowerCase();
        for (i = 10; i < 16; ++i) {
          decoder$1[hex.charAt(i)] = i;
        }
        for (i = 0; i < ignore.length; ++i) {
          decoder$1[ignore.charAt(i)] = -1;
        }
      }
      var out = [];
      var bits = 0;
      var char_count = 0;
      for (i = 0; i < a.length; ++i) {
        var c = a.charAt(i);
        if (c == "=") {
          break;
        }
        c = decoder$1[c];
        if (c == -1) {
          continue;
        }
        if (c === void 0) {
          throw new Error("Illegal character at offset " + i);
        }
        bits |= c;
        if (++char_count >= 2) {
          out[out.length] = bits;
          bits = 0;
          char_count = 0;
        } else {
          bits <<= 4;
        }
      }
      if (char_count) {
        throw new Error("Hex encoding incomplete: 4 bits missing");
      }
      return out;
    }
  };
  var decoder;
  var Base64 = {
    decode: function(a) {
      var i;
      if (decoder === void 0) {
        var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var ignore = "= \f\n\r	 \u2028\u2029";
        decoder = /* @__PURE__ */ Object.create(null);
        for (i = 0; i < 64; ++i) {
          decoder[b64.charAt(i)] = i;
        }
        decoder["-"] = 62;
        decoder["_"] = 63;
        for (i = 0; i < ignore.length; ++i) {
          decoder[ignore.charAt(i)] = -1;
        }
      }
      var out = [];
      var bits = 0;
      var char_count = 0;
      for (i = 0; i < a.length; ++i) {
        var c = a.charAt(i);
        if (c == "=") {
          break;
        }
        c = decoder[c];
        if (c == -1) {
          continue;
        }
        if (c === void 0) {
          throw new Error("Illegal character at offset " + i);
        }
        bits |= c;
        if (++char_count >= 4) {
          out[out.length] = bits >> 16;
          out[out.length] = bits >> 8 & 255;
          out[out.length] = bits & 255;
          bits = 0;
          char_count = 0;
        } else {
          bits <<= 6;
        }
      }
      switch (char_count) {
        case 1:
          throw new Error("Base64 encoding incomplete: at least 2 bits missing");
        case 2:
          out[out.length] = bits >> 10;
          break;
        case 3:
          out[out.length] = bits >> 16;
          out[out.length] = bits >> 8 & 255;
          break;
      }
      return out;
    },
    re: /-----BEGIN [^-]+-----([A-Za-z0-9+\/=\s]+)-----END [^-]+-----|begin-base64[^\n]+\n([A-Za-z0-9+\/=\s]+)====/,
    unarmor: function(a) {
      var m = Base64.re.exec(a);
      if (m) {
        if (m[1]) {
          a = m[1];
        } else if (m[2]) {
          a = m[2];
        } else {
          throw new Error("RegExp out of sync");
        }
      }
      return Base64.decode(a);
    }
  };
  var max = 1e13;
  var Int10 = (
    /** @class */
    function() {
      function Int102(value) {
        this.buf = [+value || 0];
      }
      Int102.prototype.mulAdd = function(m, c) {
        var b = this.buf;
        var l = b.length;
        var i;
        var t2;
        for (i = 0; i < l; ++i) {
          t2 = b[i] * m + c;
          if (t2 < max) {
            c = 0;
          } else {
            c = 0 | t2 / max;
            t2 -= c * max;
          }
          b[i] = t2;
        }
        if (c > 0) {
          b[i] = c;
        }
      };
      Int102.prototype.sub = function(c) {
        var b = this.buf;
        var l = b.length;
        var i;
        var t2;
        for (i = 0; i < l; ++i) {
          t2 = b[i] - c;
          if (t2 < 0) {
            t2 += max;
            c = 1;
          } else {
            c = 0;
          }
          b[i] = t2;
        }
        while (b[b.length - 1] === 0) {
          b.pop();
        }
      };
      Int102.prototype.toString = function(base) {
        if ((base || 10) != 10) {
          throw new Error("only base 10 is supported");
        }
        var b = this.buf;
        var s = b[b.length - 1].toString();
        for (var i = b.length - 2; i >= 0; --i) {
          s += (max + b[i]).toString().substring(1);
        }
        return s;
      };
      Int102.prototype.valueOf = function() {
        var b = this.buf;
        var v = 0;
        for (var i = b.length - 1; i >= 0; --i) {
          v = v * max + b[i];
        }
        return v;
      };
      Int102.prototype.simplify = function() {
        var b = this.buf;
        return b.length == 1 ? b[0] : this;
      };
      return Int102;
    }()
  );
  var ellipsis = "…";
  var reTimeS = /^(\d\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])(?:([0-5]\d)(?:([0-5]\d)(?:[.,](\d{1,3}))?)?)?(Z|[-+](?:[0]\d|1[0-2])([0-5]\d)?)?$/;
  var reTimeL = /^(\d\d\d\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])(?:([0-5]\d)(?:([0-5]\d)(?:[.,](\d{1,3}))?)?)?(Z|[-+](?:[0]\d|1[0-2])([0-5]\d)?)?$/;
  function stringCut(str, len) {
    if (str.length > len) {
      str = str.substring(0, len) + ellipsis;
    }
    return str;
  }
  var Stream = (
    /** @class */
    function() {
      function Stream2(enc, pos) {
        this.hexDigits = "0123456789ABCDEF";
        if (enc instanceof Stream2) {
          this.enc = enc.enc;
          this.pos = enc.pos;
        } else {
          this.enc = enc;
          this.pos = pos;
        }
      }
      Stream2.prototype.get = function(pos) {
        if (pos === void 0) {
          pos = this.pos++;
        }
        if (pos >= this.enc.length) {
          throw new Error("Requesting byte offset ".concat(pos, " on a stream of length ").concat(this.enc.length));
        }
        return "string" === typeof this.enc ? this.enc.charCodeAt(pos) : this.enc[pos];
      };
      Stream2.prototype.hexByte = function(b) {
        return this.hexDigits.charAt(b >> 4 & 15) + this.hexDigits.charAt(b & 15);
      };
      Stream2.prototype.hexDump = function(start, end, raw) {
        var s = "";
        for (var i = start; i < end; ++i) {
          s += this.hexByte(this.get(i));
          if (raw !== true) {
            switch (i & 15) {
              case 7:
                s += "  ";
                break;
              case 15:
                s += "\n";
                break;
              default:
                s += " ";
            }
          }
        }
        return s;
      };
      Stream2.prototype.isASCII = function(start, end) {
        for (var i = start; i < end; ++i) {
          var c = this.get(i);
          if (c < 32 || c > 176) {
            return false;
          }
        }
        return true;
      };
      Stream2.prototype.parseStringISO = function(start, end) {
        var s = "";
        for (var i = start; i < end; ++i) {
          s += String.fromCharCode(this.get(i));
        }
        return s;
      };
      Stream2.prototype.parseStringUTF = function(start, end) {
        var s = "";
        for (var i = start; i < end; ) {
          var c = this.get(i++);
          if (c < 128) {
            s += String.fromCharCode(c);
          } else if (c > 191 && c < 224) {
            s += String.fromCharCode((c & 31) << 6 | this.get(i++) & 63);
          } else {
            s += String.fromCharCode((c & 15) << 12 | (this.get(i++) & 63) << 6 | this.get(i++) & 63);
          }
        }
        return s;
      };
      Stream2.prototype.parseStringBMP = function(start, end) {
        var str = "";
        var hi;
        var lo;
        for (var i = start; i < end; ) {
          hi = this.get(i++);
          lo = this.get(i++);
          str += String.fromCharCode(hi << 8 | lo);
        }
        return str;
      };
      Stream2.prototype.parseTime = function(start, end, shortYear) {
        var s = this.parseStringISO(start, end);
        var m = (shortYear ? reTimeS : reTimeL).exec(s);
        if (!m) {
          return "Unrecognized time: " + s;
        }
        if (shortYear) {
          m[1] = +m[1];
          m[1] += +m[1] < 70 ? 2e3 : 1900;
        }
        s = m[1] + "-" + m[2] + "-" + m[3] + " " + m[4];
        if (m[5]) {
          s += ":" + m[5];
          if (m[6]) {
            s += ":" + m[6];
            if (m[7]) {
              s += "." + m[7];
            }
          }
        }
        if (m[8]) {
          s += " UTC";
          if (m[8] != "Z") {
            s += m[8];
            if (m[9]) {
              s += ":" + m[9];
            }
          }
        }
        return s;
      };
      Stream2.prototype.parseInteger = function(start, end) {
        var v = this.get(start);
        var neg = v > 127;
        var pad = neg ? 255 : 0;
        var len;
        var s = "";
        while (v == pad && ++start < end) {
          v = this.get(start);
        }
        len = end - start;
        if (len === 0) {
          return neg ? -1 : 0;
        }
        if (len > 4) {
          s = v;
          len <<= 3;
          while (((+s ^ pad) & 128) == 0) {
            s = +s << 1;
            --len;
          }
          s = "(" + len + " bit)\n";
        }
        if (neg) {
          v = v - 256;
        }
        var n = new Int10(v);
        for (var i = start + 1; i < end; ++i) {
          n.mulAdd(256, this.get(i));
        }
        return s + n.toString();
      };
      Stream2.prototype.parseBitString = function(start, end, maxLength) {
        var unusedBit = this.get(start);
        var lenBit = (end - start - 1 << 3) - unusedBit;
        var intro = "(" + lenBit + " bit)\n";
        var s = "";
        for (var i = start + 1; i < end; ++i) {
          var b = this.get(i);
          var skip = i == end - 1 ? unusedBit : 0;
          for (var j = 7; j >= skip; --j) {
            s += b >> j & 1 ? "1" : "0";
          }
          if (s.length > maxLength) {
            return intro + stringCut(s, maxLength);
          }
        }
        return intro + s;
      };
      Stream2.prototype.parseOctetString = function(start, end, maxLength) {
        if (this.isASCII(start, end)) {
          return stringCut(this.parseStringISO(start, end), maxLength);
        }
        var len = end - start;
        var s = "(" + len + " byte)\n";
        maxLength /= 2;
        if (len > maxLength) {
          end = start + maxLength;
        }
        for (var i = start; i < end; ++i) {
          s += this.hexByte(this.get(i));
        }
        if (len > maxLength) {
          s += ellipsis;
        }
        return s;
      };
      Stream2.prototype.parseOID = function(start, end, maxLength) {
        var s = "";
        var n = new Int10();
        var bits = 0;
        for (var i = start; i < end; ++i) {
          var v = this.get(i);
          n.mulAdd(128, v & 127);
          bits += 7;
          if (!(v & 128)) {
            if (s === "") {
              n = n.simplify();
              if (n instanceof Int10) {
                n.sub(80);
                s = "2." + n.toString();
              } else {
                var m = n < 80 ? n < 40 ? 0 : 1 : 2;
                s = m + "." + (n - m * 40);
              }
            } else {
              s += "." + n.toString();
            }
            if (s.length > maxLength) {
              return stringCut(s, maxLength);
            }
            n = new Int10();
            bits = 0;
          }
        }
        if (bits > 0) {
          s += ".incomplete";
        }
        return s;
      };
      return Stream2;
    }()
  );
  var ASN1 = (
    /** @class */
    function() {
      function ASN12(stream, header, length, tag, sub) {
        if (!(tag instanceof ASN1Tag)) {
          throw new Error("Invalid tag value.");
        }
        this.stream = stream;
        this.header = header;
        this.length = length;
        this.tag = tag;
        this.sub = sub;
      }
      ASN12.prototype.typeName = function() {
        switch (this.tag.tagClass) {
          case 0:
            switch (this.tag.tagNumber) {
              case 0:
                return "EOC";
              case 1:
                return "BOOLEAN";
              case 2:
                return "INTEGER";
              case 3:
                return "BIT_STRING";
              case 4:
                return "OCTET_STRING";
              case 5:
                return "NULL";
              case 6:
                return "OBJECT_IDENTIFIER";
              case 7:
                return "ObjectDescriptor";
              case 8:
                return "EXTERNAL";
              case 9:
                return "REAL";
              case 10:
                return "ENUMERATED";
              case 11:
                return "EMBEDDED_PDV";
              case 12:
                return "UTF8String";
              case 16:
                return "SEQUENCE";
              case 17:
                return "SET";
              case 18:
                return "NumericString";
              case 19:
                return "PrintableString";
              case 20:
                return "TeletexString";
              case 21:
                return "VideotexString";
              case 22:
                return "IA5String";
              case 23:
                return "UTCTime";
              case 24:
                return "GeneralizedTime";
              case 25:
                return "GraphicString";
              case 26:
                return "VisibleString";
              case 27:
                return "GeneralString";
              case 28:
                return "UniversalString";
              case 30:
                return "BMPString";
            }
            return "Universal_" + this.tag.tagNumber.toString();
          case 1:
            return "Application_" + this.tag.tagNumber.toString();
          case 2:
            return "[" + this.tag.tagNumber.toString() + "]";
          case 3:
            return "Private_" + this.tag.tagNumber.toString();
        }
      };
      ASN12.prototype.content = function(maxLength) {
        if (this.tag === void 0) {
          return null;
        }
        if (maxLength === void 0) {
          maxLength = Infinity;
        }
        var content = this.posContent();
        var len = Math.abs(this.length);
        if (!this.tag.isUniversal()) {
          if (this.sub !== null) {
            return "(" + this.sub.length + " elem)";
          }
          return this.stream.parseOctetString(content, content + len, maxLength);
        }
        switch (this.tag.tagNumber) {
          case 1:
            return this.stream.get(content) === 0 ? "false" : "true";
          case 2:
            return this.stream.parseInteger(content, content + len);
          case 3:
            return this.sub ? "(" + this.sub.length + " elem)" : this.stream.parseBitString(content, content + len, maxLength);
          case 4:
            return this.sub ? "(" + this.sub.length + " elem)" : this.stream.parseOctetString(content, content + len, maxLength);
          case 6:
            return this.stream.parseOID(content, content + len, maxLength);
          case 16:
          case 17:
            if (this.sub !== null) {
              return "(" + this.sub.length + " elem)";
            } else {
              return "(no elem)";
            }
          case 12:
            return stringCut(this.stream.parseStringUTF(content, content + len), maxLength);
          case 18:
          case 19:
          case 20:
          case 21:
          case 22:
          case 26:
            return stringCut(this.stream.parseStringISO(content, content + len), maxLength);
          case 30:
            return stringCut(this.stream.parseStringBMP(content, content + len), maxLength);
          case 23:
          case 24:
            return this.stream.parseTime(content, content + len, this.tag.tagNumber == 23);
        }
        return null;
      };
      ASN12.prototype.toString = function() {
        return this.typeName() + "@" + this.stream.pos + "[header:" + this.header + ",length:" + this.length + ",sub:" + (this.sub === null ? "null" : this.sub.length) + "]";
      };
      ASN12.prototype.toPrettyString = function(indent) {
        if (indent === void 0) {
          indent = "";
        }
        var s = indent + this.typeName() + " @" + this.stream.pos;
        if (this.length >= 0) {
          s += "+";
        }
        s += this.length;
        if (this.tag.tagConstructed) {
          s += " (constructed)";
        } else if (this.tag.isUniversal() && (this.tag.tagNumber == 3 || this.tag.tagNumber == 4) && this.sub !== null) {
          s += " (encapsulates)";
        }
        s += "\n";
        if (this.sub !== null) {
          indent += "  ";
          for (var i = 0, max2 = this.sub.length; i < max2; ++i) {
            s += this.sub[i].toPrettyString(indent);
          }
        }
        return s;
      };
      ASN12.prototype.posStart = function() {
        return this.stream.pos;
      };
      ASN12.prototype.posContent = function() {
        return this.stream.pos + this.header;
      };
      ASN12.prototype.posEnd = function() {
        return this.stream.pos + this.header + Math.abs(this.length);
      };
      ASN12.prototype.toHexString = function() {
        return this.stream.hexDump(this.posStart(), this.posEnd(), true);
      };
      ASN12.decodeLength = function(stream) {
        var buf = stream.get();
        var len = buf & 127;
        if (len == buf) {
          return len;
        }
        if (len > 6) {
          throw new Error("Length over 48 bits not supported at position " + (stream.pos - 1));
        }
        if (len === 0) {
          return null;
        }
        buf = 0;
        for (var i = 0; i < len; ++i) {
          buf = buf * 256 + stream.get();
        }
        return buf;
      };
      ASN12.prototype.getHexStringValue = function() {
        var hexString = this.toHexString();
        var offset = this.header * 2;
        var length = this.length * 2;
        return hexString.substr(offset, length);
      };
      ASN12.decode = function(str) {
        var stream;
        if (!(str instanceof Stream)) {
          stream = new Stream(str, 0);
        } else {
          stream = str;
        }
        var streamStart = new Stream(stream);
        var tag = new ASN1Tag(stream);
        var len = ASN12.decodeLength(stream);
        var start = stream.pos;
        var header = start - streamStart.pos;
        var sub = null;
        var getSub = function() {
          var ret = [];
          if (len !== null) {
            var end = start + len;
            while (stream.pos < end) {
              ret[ret.length] = ASN12.decode(stream);
            }
            if (stream.pos != end) {
              throw new Error("Content size is not correct for container starting at offset " + start);
            }
          } else {
            try {
              for (; ; ) {
                var s = ASN12.decode(stream);
                if (s.tag.isEOC()) {
                  break;
                }
                ret[ret.length] = s;
              }
              len = start - stream.pos;
            } catch (e) {
              throw new Error("Exception while decoding undefined length content: " + e);
            }
          }
          return ret;
        };
        if (tag.tagConstructed) {
          sub = getSub();
        } else if (tag.isUniversal() && (tag.tagNumber == 3 || tag.tagNumber == 4)) {
          try {
            if (tag.tagNumber == 3) {
              if (stream.get() != 0) {
                throw new Error("BIT STRINGs with unused bits cannot encapsulate.");
              }
            }
            sub = getSub();
            for (var i = 0; i < sub.length; ++i) {
              if (sub[i].tag.isEOC()) {
                throw new Error("EOC is not supposed to be actual content.");
              }
            }
          } catch (e) {
            sub = null;
          }
        }
        if (sub === null) {
          if (len === null) {
            throw new Error("We can't skip over an invalid tag with undefined length at offset " + start);
          }
          stream.pos = start + Math.abs(len);
        }
        return new ASN12(streamStart, header, len, tag, sub);
      };
      return ASN12;
    }()
  );
  var ASN1Tag = (
    /** @class */
    function() {
      function ASN1Tag2(stream) {
        var buf = stream.get();
        this.tagClass = buf >> 6;
        this.tagConstructed = (buf & 32) !== 0;
        this.tagNumber = buf & 31;
        if (this.tagNumber == 31) {
          var n = new Int10();
          do {
            buf = stream.get();
            n.mulAdd(128, buf & 127);
          } while (buf & 128);
          this.tagNumber = n.simplify();
        }
      }
      ASN1Tag2.prototype.isUniversal = function() {
        return this.tagClass === 0;
      };
      ASN1Tag2.prototype.isEOC = function() {
        return this.tagClass === 0 && this.tagNumber === 0;
      };
      return ASN1Tag2;
    }()
  );
  var dbits;
  var canary = 244837814094590;
  var j_lm = (canary & 16777215) == 15715070;
  var lowprimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
  var lplim = (1 << 26) / lowprimes[lowprimes.length - 1];
  var BigInteger = (
    /** @class */
    function() {
      function BigInteger2(a, b, c) {
        if (a != null) {
          if ("number" == typeof a) {
            this.fromNumber(a, b, c);
          } else if (b == null && "string" != typeof a) {
            this.fromString(a, 256);
          } else {
            this.fromString(a, b);
          }
        }
      }
      BigInteger2.prototype.toString = function(b) {
        if (this.s < 0) {
          return "-" + this.negate().toString(b);
        }
        var k;
        if (b == 16) {
          k = 4;
        } else if (b == 8) {
          k = 3;
        } else if (b == 2) {
          k = 1;
        } else if (b == 32) {
          k = 5;
        } else if (b == 4) {
          k = 2;
        } else {
          return this.toRadix(b);
        }
        var km = (1 << k) - 1;
        var d;
        var m = false;
        var r = "";
        var i = this.t;
        var p = this.DB - i * this.DB % k;
        if (i-- > 0) {
          if (p < this.DB && (d = this[i] >> p) > 0) {
            m = true;
            r = int2char(d);
          }
          while (i >= 0) {
            if (p < k) {
              d = (this[i] & (1 << p) - 1) << k - p;
              d |= this[--i] >> (p += this.DB - k);
            } else {
              d = this[i] >> (p -= k) & km;
              if (p <= 0) {
                p += this.DB;
                --i;
              }
            }
            if (d > 0) {
              m = true;
            }
            if (m) {
              r += int2char(d);
            }
          }
        }
        return m ? r : "0";
      };
      BigInteger2.prototype.negate = function() {
        var r = nbi();
        BigInteger2.ZERO.subTo(this, r);
        return r;
      };
      BigInteger2.prototype.abs = function() {
        return this.s < 0 ? this.negate() : this;
      };
      BigInteger2.prototype.compareTo = function(a) {
        var r = this.s - a.s;
        if (r != 0) {
          return r;
        }
        var i = this.t;
        r = i - a.t;
        if (r != 0) {
          return this.s < 0 ? -r : r;
        }
        while (--i >= 0) {
          if ((r = this[i] - a[i]) != 0) {
            return r;
          }
        }
        return 0;
      };
      BigInteger2.prototype.bitLength = function() {
        if (this.t <= 0) {
          return 0;
        }
        return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ this.s & this.DM);
      };
      BigInteger2.prototype.mod = function(a) {
        var r = nbi();
        this.abs().divRemTo(a, null, r);
        if (this.s < 0 && r.compareTo(BigInteger2.ZERO) > 0) {
          a.subTo(r, r);
        }
        return r;
      };
      BigInteger2.prototype.modPowInt = function(e, m) {
        var z2;
        if (e < 256 || m.isEven()) {
          z2 = new Classic(m);
        } else {
          z2 = new Montgomery(m);
        }
        return this.exp(e, z2);
      };
      BigInteger2.prototype.clone = function() {
        var r = nbi();
        this.copyTo(r);
        return r;
      };
      BigInteger2.prototype.intValue = function() {
        if (this.s < 0) {
          if (this.t == 1) {
            return this[0] - this.DV;
          } else if (this.t == 0) {
            return -1;
          }
        } else if (this.t == 1) {
          return this[0];
        } else if (this.t == 0) {
          return 0;
        }
        return (this[1] & (1 << 32 - this.DB) - 1) << this.DB | this[0];
      };
      BigInteger2.prototype.byteValue = function() {
        return this.t == 0 ? this.s : this[0] << 24 >> 24;
      };
      BigInteger2.prototype.shortValue = function() {
        return this.t == 0 ? this.s : this[0] << 16 >> 16;
      };
      BigInteger2.prototype.signum = function() {
        if (this.s < 0) {
          return -1;
        } else if (this.t <= 0 || this.t == 1 && this[0] <= 0) {
          return 0;
        } else {
          return 1;
        }
      };
      BigInteger2.prototype.toByteArray = function() {
        var i = this.t;
        var r = [];
        r[0] = this.s;
        var p = this.DB - i * this.DB % 8;
        var d;
        var k = 0;
        if (i-- > 0) {
          if (p < this.DB && (d = this[i] >> p) != (this.s & this.DM) >> p) {
            r[k++] = d | this.s << this.DB - p;
          }
          while (i >= 0) {
            if (p < 8) {
              d = (this[i] & (1 << p) - 1) << 8 - p;
              d |= this[--i] >> (p += this.DB - 8);
            } else {
              d = this[i] >> (p -= 8) & 255;
              if (p <= 0) {
                p += this.DB;
                --i;
              }
            }
            if ((d & 128) != 0) {
              d |= -256;
            }
            if (k == 0 && (this.s & 128) != (d & 128)) {
              ++k;
            }
            if (k > 0 || d != this.s) {
              r[k++] = d;
            }
          }
        }
        return r;
      };
      BigInteger2.prototype.equals = function(a) {
        return this.compareTo(a) == 0;
      };
      BigInteger2.prototype.min = function(a) {
        return this.compareTo(a) < 0 ? this : a;
      };
      BigInteger2.prototype.max = function(a) {
        return this.compareTo(a) > 0 ? this : a;
      };
      BigInteger2.prototype.and = function(a) {
        var r = nbi();
        this.bitwiseTo(a, op_and, r);
        return r;
      };
      BigInteger2.prototype.or = function(a) {
        var r = nbi();
        this.bitwiseTo(a, op_or, r);
        return r;
      };
      BigInteger2.prototype.xor = function(a) {
        var r = nbi();
        this.bitwiseTo(a, op_xor, r);
        return r;
      };
      BigInteger2.prototype.andNot = function(a) {
        var r = nbi();
        this.bitwiseTo(a, op_andnot, r);
        return r;
      };
      BigInteger2.prototype.not = function() {
        var r = nbi();
        for (var i = 0; i < this.t; ++i) {
          r[i] = this.DM & ~this[i];
        }
        r.t = this.t;
        r.s = ~this.s;
        return r;
      };
      BigInteger2.prototype.shiftLeft = function(n) {
        var r = nbi();
        if (n < 0) {
          this.rShiftTo(-n, r);
        } else {
          this.lShiftTo(n, r);
        }
        return r;
      };
      BigInteger2.prototype.shiftRight = function(n) {
        var r = nbi();
        if (n < 0) {
          this.lShiftTo(-n, r);
        } else {
          this.rShiftTo(n, r);
        }
        return r;
      };
      BigInteger2.prototype.getLowestSetBit = function() {
        for (var i = 0; i < this.t; ++i) {
          if (this[i] != 0) {
            return i * this.DB + lbit(this[i]);
          }
        }
        if (this.s < 0) {
          return this.t * this.DB;
        }
        return -1;
      };
      BigInteger2.prototype.bitCount = function() {
        var r = 0;
        var x = this.s & this.DM;
        for (var i = 0; i < this.t; ++i) {
          r += cbit(this[i] ^ x);
        }
        return r;
      };
      BigInteger2.prototype.testBit = function(n) {
        var j = Math.floor(n / this.DB);
        if (j >= this.t) {
          return this.s != 0;
        }
        return (this[j] & 1 << n % this.DB) != 0;
      };
      BigInteger2.prototype.setBit = function(n) {
        return this.changeBit(n, op_or);
      };
      BigInteger2.prototype.clearBit = function(n) {
        return this.changeBit(n, op_andnot);
      };
      BigInteger2.prototype.flipBit = function(n) {
        return this.changeBit(n, op_xor);
      };
      BigInteger2.prototype.add = function(a) {
        var r = nbi();
        this.addTo(a, r);
        return r;
      };
      BigInteger2.prototype.subtract = function(a) {
        var r = nbi();
        this.subTo(a, r);
        return r;
      };
      BigInteger2.prototype.multiply = function(a) {
        var r = nbi();
        this.multiplyTo(a, r);
        return r;
      };
      BigInteger2.prototype.divide = function(a) {
        var r = nbi();
        this.divRemTo(a, r, null);
        return r;
      };
      BigInteger2.prototype.remainder = function(a) {
        var r = nbi();
        this.divRemTo(a, null, r);
        return r;
      };
      BigInteger2.prototype.divideAndRemainder = function(a) {
        var q = nbi();
        var r = nbi();
        this.divRemTo(a, q, r);
        return [q, r];
      };
      BigInteger2.prototype.modPow = function(e, m) {
        var i = e.bitLength();
        var k;
        var r = nbv(1);
        var z2;
        if (i <= 0) {
          return r;
        } else if (i < 18) {
          k = 1;
        } else if (i < 48) {
          k = 3;
        } else if (i < 144) {
          k = 4;
        } else if (i < 768) {
          k = 5;
        } else {
          k = 6;
        }
        if (i < 8) {
          z2 = new Classic(m);
        } else if (m.isEven()) {
          z2 = new Barrett(m);
        } else {
          z2 = new Montgomery(m);
        }
        var g = [];
        var n = 3;
        var k1 = k - 1;
        var km = (1 << k) - 1;
        g[1] = z2.convert(this);
        if (k > 1) {
          var g2 = nbi();
          z2.sqrTo(g[1], g2);
          while (n <= km) {
            g[n] = nbi();
            z2.mulTo(g2, g[n - 2], g[n]);
            n += 2;
          }
        }
        var j = e.t - 1;
        var w;
        var is1 = true;
        var r2 = nbi();
        var t2;
        i = nbits(e[j]) - 1;
        while (j >= 0) {
          if (i >= k1) {
            w = e[j] >> i - k1 & km;
          } else {
            w = (e[j] & (1 << i + 1) - 1) << k1 - i;
            if (j > 0) {
              w |= e[j - 1] >> this.DB + i - k1;
            }
          }
          n = k;
          while ((w & 1) == 0) {
            w >>= 1;
            --n;
          }
          if ((i -= n) < 0) {
            i += this.DB;
            --j;
          }
          if (is1) {
            g[w].copyTo(r);
            is1 = false;
          } else {
            while (n > 1) {
              z2.sqrTo(r, r2);
              z2.sqrTo(r2, r);
              n -= 2;
            }
            if (n > 0) {
              z2.sqrTo(r, r2);
            } else {
              t2 = r;
              r = r2;
              r2 = t2;
            }
            z2.mulTo(r2, g[w], r);
          }
          while (j >= 0 && (e[j] & 1 << i) == 0) {
            z2.sqrTo(r, r2);
            t2 = r;
            r = r2;
            r2 = t2;
            if (--i < 0) {
              i = this.DB - 1;
              --j;
            }
          }
        }
        return z2.revert(r);
      };
      BigInteger2.prototype.modInverse = function(m) {
        var ac = m.isEven();
        if (this.isEven() && ac || m.signum() == 0) {
          return BigInteger2.ZERO;
        }
        var u = m.clone();
        var v = this.clone();
        var a = nbv(1);
        var b = nbv(0);
        var c = nbv(0);
        var d = nbv(1);
        while (u.signum() != 0) {
          while (u.isEven()) {
            u.rShiftTo(1, u);
            if (ac) {
              if (!a.isEven() || !b.isEven()) {
                a.addTo(this, a);
                b.subTo(m, b);
              }
              a.rShiftTo(1, a);
            } else if (!b.isEven()) {
              b.subTo(m, b);
            }
            b.rShiftTo(1, b);
          }
          while (v.isEven()) {
            v.rShiftTo(1, v);
            if (ac) {
              if (!c.isEven() || !d.isEven()) {
                c.addTo(this, c);
                d.subTo(m, d);
              }
              c.rShiftTo(1, c);
            } else if (!d.isEven()) {
              d.subTo(m, d);
            }
            d.rShiftTo(1, d);
          }
          if (u.compareTo(v) >= 0) {
            u.subTo(v, u);
            if (ac) {
              a.subTo(c, a);
            }
            b.subTo(d, b);
          } else {
            v.subTo(u, v);
            if (ac) {
              c.subTo(a, c);
            }
            d.subTo(b, d);
          }
        }
        if (v.compareTo(BigInteger2.ONE) != 0) {
          return BigInteger2.ZERO;
        }
        if (d.compareTo(m) >= 0) {
          return d.subtract(m);
        }
        if (d.signum() < 0) {
          d.addTo(m, d);
        } else {
          return d;
        }
        if (d.signum() < 0) {
          return d.add(m);
        } else {
          return d;
        }
      };
      BigInteger2.prototype.pow = function(e) {
        return this.exp(e, new NullExp());
      };
      BigInteger2.prototype.gcd = function(a) {
        var x = this.s < 0 ? this.negate() : this.clone();
        var y = a.s < 0 ? a.negate() : a.clone();
        if (x.compareTo(y) < 0) {
          var t2 = x;
          x = y;
          y = t2;
        }
        var i = x.getLowestSetBit();
        var g = y.getLowestSetBit();
        if (g < 0) {
          return x;
        }
        if (i < g) {
          g = i;
        }
        if (g > 0) {
          x.rShiftTo(g, x);
          y.rShiftTo(g, y);
        }
        while (x.signum() > 0) {
          if ((i = x.getLowestSetBit()) > 0) {
            x.rShiftTo(i, x);
          }
          if ((i = y.getLowestSetBit()) > 0) {
            y.rShiftTo(i, y);
          }
          if (x.compareTo(y) >= 0) {
            x.subTo(y, x);
            x.rShiftTo(1, x);
          } else {
            y.subTo(x, y);
            y.rShiftTo(1, y);
          }
        }
        if (g > 0) {
          y.lShiftTo(g, y);
        }
        return y;
      };
      BigInteger2.prototype.isProbablePrime = function(t2) {
        var i;
        var x = this.abs();
        if (x.t == 1 && x[0] <= lowprimes[lowprimes.length - 1]) {
          for (i = 0; i < lowprimes.length; ++i) {
            if (x[0] == lowprimes[i]) {
              return true;
            }
          }
          return false;
        }
        if (x.isEven()) {
          return false;
        }
        i = 1;
        while (i < lowprimes.length) {
          var m = lowprimes[i];
          var j = i + 1;
          while (j < lowprimes.length && m < lplim) {
            m *= lowprimes[j++];
          }
          m = x.modInt(m);
          while (i < j) {
            if (m % lowprimes[i++] == 0) {
              return false;
            }
          }
        }
        return x.millerRabin(t2);
      };
      BigInteger2.prototype.copyTo = function(r) {
        for (var i = this.t - 1; i >= 0; --i) {
          r[i] = this[i];
        }
        r.t = this.t;
        r.s = this.s;
      };
      BigInteger2.prototype.fromInt = function(x) {
        this.t = 1;
        this.s = x < 0 ? -1 : 0;
        if (x > 0) {
          this[0] = x;
        } else if (x < -1) {
          this[0] = x + this.DV;
        } else {
          this.t = 0;
        }
      };
      BigInteger2.prototype.fromString = function(s, b) {
        var k;
        if (b == 16) {
          k = 4;
        } else if (b == 8) {
          k = 3;
        } else if (b == 256) {
          k = 8;
        } else if (b == 2) {
          k = 1;
        } else if (b == 32) {
          k = 5;
        } else if (b == 4) {
          k = 2;
        } else {
          this.fromRadix(s, b);
          return;
        }
        this.t = 0;
        this.s = 0;
        var i = s.length;
        var mi = false;
        var sh = 0;
        while (--i >= 0) {
          var x = k == 8 ? +s[i] & 255 : intAt(s, i);
          if (x < 0) {
            if (s.charAt(i) == "-") {
              mi = true;
            }
            continue;
          }
          mi = false;
          if (sh == 0) {
            this[this.t++] = x;
          } else if (sh + k > this.DB) {
            this[this.t - 1] |= (x & (1 << this.DB - sh) - 1) << sh;
            this[this.t++] = x >> this.DB - sh;
          } else {
            this[this.t - 1] |= x << sh;
          }
          sh += k;
          if (sh >= this.DB) {
            sh -= this.DB;
          }
        }
        if (k == 8 && (+s[0] & 128) != 0) {
          this.s = -1;
          if (sh > 0) {
            this[this.t - 1] |= (1 << this.DB - sh) - 1 << sh;
          }
        }
        this.clamp();
        if (mi) {
          BigInteger2.ZERO.subTo(this, this);
        }
      };
      BigInteger2.prototype.clamp = function() {
        var c = this.s & this.DM;
        while (this.t > 0 && this[this.t - 1] == c) {
          --this.t;
        }
      };
      BigInteger2.prototype.dlShiftTo = function(n, r) {
        var i;
        for (i = this.t - 1; i >= 0; --i) {
          r[i + n] = this[i];
        }
        for (i = n - 1; i >= 0; --i) {
          r[i] = 0;
        }
        r.t = this.t + n;
        r.s = this.s;
      };
      BigInteger2.prototype.drShiftTo = function(n, r) {
        for (var i = n; i < this.t; ++i) {
          r[i - n] = this[i];
        }
        r.t = Math.max(this.t - n, 0);
        r.s = this.s;
      };
      BigInteger2.prototype.lShiftTo = function(n, r) {
        var bs = n % this.DB;
        var cbs = this.DB - bs;
        var bm = (1 << cbs) - 1;
        var ds = Math.floor(n / this.DB);
        var c = this.s << bs & this.DM;
        for (var i = this.t - 1; i >= 0; --i) {
          r[i + ds + 1] = this[i] >> cbs | c;
          c = (this[i] & bm) << bs;
        }
        for (var i = ds - 1; i >= 0; --i) {
          r[i] = 0;
        }
        r[ds] = c;
        r.t = this.t + ds + 1;
        r.s = this.s;
        r.clamp();
      };
      BigInteger2.prototype.rShiftTo = function(n, r) {
        r.s = this.s;
        var ds = Math.floor(n / this.DB);
        if (ds >= this.t) {
          r.t = 0;
          return;
        }
        var bs = n % this.DB;
        var cbs = this.DB - bs;
        var bm = (1 << bs) - 1;
        r[0] = this[ds] >> bs;
        for (var i = ds + 1; i < this.t; ++i) {
          r[i - ds - 1] |= (this[i] & bm) << cbs;
          r[i - ds] = this[i] >> bs;
        }
        if (bs > 0) {
          r[this.t - ds - 1] |= (this.s & bm) << cbs;
        }
        r.t = this.t - ds;
        r.clamp();
      };
      BigInteger2.prototype.subTo = function(a, r) {
        var i = 0;
        var c = 0;
        var m = Math.min(a.t, this.t);
        while (i < m) {
          c += this[i] - a[i];
          r[i++] = c & this.DM;
          c >>= this.DB;
        }
        if (a.t < this.t) {
          c -= a.s;
          while (i < this.t) {
            c += this[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
          }
          c += this.s;
        } else {
          c += this.s;
          while (i < a.t) {
            c -= a[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
          }
          c -= a.s;
        }
        r.s = c < 0 ? -1 : 0;
        if (c < -1) {
          r[i++] = this.DV + c;
        } else if (c > 0) {
          r[i++] = c;
        }
        r.t = i;
        r.clamp();
      };
      BigInteger2.prototype.multiplyTo = function(a, r) {
        var x = this.abs();
        var y = a.abs();
        var i = x.t;
        r.t = i + y.t;
        while (--i >= 0) {
          r[i] = 0;
        }
        for (i = 0; i < y.t; ++i) {
          r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
        }
        r.s = 0;
        r.clamp();
        if (this.s != a.s) {
          BigInteger2.ZERO.subTo(r, r);
        }
      };
      BigInteger2.prototype.squareTo = function(r) {
        var x = this.abs();
        var i = r.t = 2 * x.t;
        while (--i >= 0) {
          r[i] = 0;
        }
        for (i = 0; i < x.t - 1; ++i) {
          var c = x.am(i, x[i], r, 2 * i, 0, 1);
          if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
            r[i + x.t] -= x.DV;
            r[i + x.t + 1] = 1;
          }
        }
        if (r.t > 0) {
          r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
        }
        r.s = 0;
        r.clamp();
      };
      BigInteger2.prototype.divRemTo = function(m, q, r) {
        var pm = m.abs();
        if (pm.t <= 0) {
          return;
        }
        var pt = this.abs();
        if (pt.t < pm.t) {
          if (q != null) {
            q.fromInt(0);
          }
          if (r != null) {
            this.copyTo(r);
          }
          return;
        }
        if (r == null) {
          r = nbi();
        }
        var y = nbi();
        var ts = this.s;
        var ms = m.s;
        var nsh = this.DB - nbits(pm[pm.t - 1]);
        if (nsh > 0) {
          pm.lShiftTo(nsh, y);
          pt.lShiftTo(nsh, r);
        } else {
          pm.copyTo(y);
          pt.copyTo(r);
        }
        var ys = y.t;
        var y0 = y[ys - 1];
        if (y0 == 0) {
          return;
        }
        var yt = y0 * (1 << this.F1) + (ys > 1 ? y[ys - 2] >> this.F2 : 0);
        var d1 = this.FV / yt;
        var d2 = (1 << this.F1) / yt;
        var e = 1 << this.F2;
        var i = r.t;
        var j = i - ys;
        var t2 = q == null ? nbi() : q;
        y.dlShiftTo(j, t2);
        if (r.compareTo(t2) >= 0) {
          r[r.t++] = 1;
          r.subTo(t2, r);
        }
        BigInteger2.ONE.dlShiftTo(ys, t2);
        t2.subTo(y, y);
        while (y.t < ys) {
          y[y.t++] = 0;
        }
        while (--j >= 0) {
          var qd = r[--i] == y0 ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);
          if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) {
            y.dlShiftTo(j, t2);
            r.subTo(t2, r);
            while (r[i] < --qd) {
              r.subTo(t2, r);
            }
          }
        }
        if (q != null) {
          r.drShiftTo(ys, q);
          if (ts != ms) {
            BigInteger2.ZERO.subTo(q, q);
          }
        }
        r.t = ys;
        r.clamp();
        if (nsh > 0) {
          r.rShiftTo(nsh, r);
        }
        if (ts < 0) {
          BigInteger2.ZERO.subTo(r, r);
        }
      };
      BigInteger2.prototype.invDigit = function() {
        if (this.t < 1) {
          return 0;
        }
        var x = this[0];
        if ((x & 1) == 0) {
          return 0;
        }
        var y = x & 3;
        y = y * (2 - (x & 15) * y) & 15;
        y = y * (2 - (x & 255) * y) & 255;
        y = y * (2 - ((x & 65535) * y & 65535)) & 65535;
        y = y * (2 - x * y % this.DV) % this.DV;
        return y > 0 ? this.DV - y : -y;
      };
      BigInteger2.prototype.isEven = function() {
        return (this.t > 0 ? this[0] & 1 : this.s) == 0;
      };
      BigInteger2.prototype.exp = function(e, z2) {
        if (e > 4294967295 || e < 1) {
          return BigInteger2.ONE;
        }
        var r = nbi();
        var r2 = nbi();
        var g = z2.convert(this);
        var i = nbits(e) - 1;
        g.copyTo(r);
        while (--i >= 0) {
          z2.sqrTo(r, r2);
          if ((e & 1 << i) > 0) {
            z2.mulTo(r2, g, r);
          } else {
            var t2 = r;
            r = r2;
            r2 = t2;
          }
        }
        return z2.revert(r);
      };
      BigInteger2.prototype.chunkSize = function(r) {
        return Math.floor(Math.LN2 * this.DB / Math.log(r));
      };
      BigInteger2.prototype.toRadix = function(b) {
        if (b == null) {
          b = 10;
        }
        if (this.signum() == 0 || b < 2 || b > 36) {
          return "0";
        }
        var cs = this.chunkSize(b);
        var a = Math.pow(b, cs);
        var d = nbv(a);
        var y = nbi();
        var z2 = nbi();
        var r = "";
        this.divRemTo(d, y, z2);
        while (y.signum() > 0) {
          r = (a + z2.intValue()).toString(b).substr(1) + r;
          y.divRemTo(d, y, z2);
        }
        return z2.intValue().toString(b) + r;
      };
      BigInteger2.prototype.fromRadix = function(s, b) {
        this.fromInt(0);
        if (b == null) {
          b = 10;
        }
        var cs = this.chunkSize(b);
        var d = Math.pow(b, cs);
        var mi = false;
        var j = 0;
        var w = 0;
        for (var i = 0; i < s.length; ++i) {
          var x = intAt(s, i);
          if (x < 0) {
            if (s.charAt(i) == "-" && this.signum() == 0) {
              mi = true;
            }
            continue;
          }
          w = b * w + x;
          if (++j >= cs) {
            this.dMultiply(d);
            this.dAddOffset(w, 0);
            j = 0;
            w = 0;
          }
        }
        if (j > 0) {
          this.dMultiply(Math.pow(b, j));
          this.dAddOffset(w, 0);
        }
        if (mi) {
          BigInteger2.ZERO.subTo(this, this);
        }
      };
      BigInteger2.prototype.fromNumber = function(a, b, c) {
        if ("number" == typeof b) {
          if (a < 2) {
            this.fromInt(1);
          } else {
            this.fromNumber(a, c);
            if (!this.testBit(a - 1)) {
              this.bitwiseTo(BigInteger2.ONE.shiftLeft(a - 1), op_or, this);
            }
            if (this.isEven()) {
              this.dAddOffset(1, 0);
            }
            while (!this.isProbablePrime(b)) {
              this.dAddOffset(2, 0);
              if (this.bitLength() > a) {
                this.subTo(BigInteger2.ONE.shiftLeft(a - 1), this);
              }
            }
          }
        } else {
          var x = [];
          var t2 = a & 7;
          x.length = (a >> 3) + 1;
          b.nextBytes(x);
          if (t2 > 0) {
            x[0] &= (1 << t2) - 1;
          } else {
            x[0] = 0;
          }
          this.fromString(x, 256);
        }
      };
      BigInteger2.prototype.bitwiseTo = function(a, op, r) {
        var i;
        var f;
        var m = Math.min(a.t, this.t);
        for (i = 0; i < m; ++i) {
          r[i] = op(this[i], a[i]);
        }
        if (a.t < this.t) {
          f = a.s & this.DM;
          for (i = m; i < this.t; ++i) {
            r[i] = op(this[i], f);
          }
          r.t = this.t;
        } else {
          f = this.s & this.DM;
          for (i = m; i < a.t; ++i) {
            r[i] = op(f, a[i]);
          }
          r.t = a.t;
        }
        r.s = op(this.s, a.s);
        r.clamp();
      };
      BigInteger2.prototype.changeBit = function(n, op) {
        var r = BigInteger2.ONE.shiftLeft(n);
        this.bitwiseTo(r, op, r);
        return r;
      };
      BigInteger2.prototype.addTo = function(a, r) {
        var i = 0;
        var c = 0;
        var m = Math.min(a.t, this.t);
        while (i < m) {
          c += this[i] + a[i];
          r[i++] = c & this.DM;
          c >>= this.DB;
        }
        if (a.t < this.t) {
          c += a.s;
          while (i < this.t) {
            c += this[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
          }
          c += this.s;
        } else {
          c += this.s;
          while (i < a.t) {
            c += a[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
          }
          c += a.s;
        }
        r.s = c < 0 ? -1 : 0;
        if (c > 0) {
          r[i++] = c;
        } else if (c < -1) {
          r[i++] = this.DV + c;
        }
        r.t = i;
        r.clamp();
      };
      BigInteger2.prototype.dMultiply = function(n) {
        this[this.t] = this.am(0, n - 1, this, 0, 0, this.t);
        ++this.t;
        this.clamp();
      };
      BigInteger2.prototype.dAddOffset = function(n, w) {
        if (n == 0) {
          return;
        }
        while (this.t <= w) {
          this[this.t++] = 0;
        }
        this[w] += n;
        while (this[w] >= this.DV) {
          this[w] -= this.DV;
          if (++w >= this.t) {
            this[this.t++] = 0;
          }
          ++this[w];
        }
      };
      BigInteger2.prototype.multiplyLowerTo = function(a, n, r) {
        var i = Math.min(this.t + a.t, n);
        r.s = 0;
        r.t = i;
        while (i > 0) {
          r[--i] = 0;
        }
        for (var j = r.t - this.t; i < j; ++i) {
          r[i + this.t] = this.am(0, a[i], r, i, 0, this.t);
        }
        for (var j = Math.min(a.t, n); i < j; ++i) {
          this.am(0, a[i], r, i, 0, n - i);
        }
        r.clamp();
      };
      BigInteger2.prototype.multiplyUpperTo = function(a, n, r) {
        --n;
        var i = r.t = this.t + a.t - n;
        r.s = 0;
        while (--i >= 0) {
          r[i] = 0;
        }
        for (i = Math.max(n - this.t, 0); i < a.t; ++i) {
          r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n);
        }
        r.clamp();
        r.drShiftTo(1, r);
      };
      BigInteger2.prototype.modInt = function(n) {
        if (n <= 0) {
          return 0;
        }
        var d = this.DV % n;
        var r = this.s < 0 ? n - 1 : 0;
        if (this.t > 0) {
          if (d == 0) {
            r = this[0] % n;
          } else {
            for (var i = this.t - 1; i >= 0; --i) {
              r = (d * r + this[i]) % n;
            }
          }
        }
        return r;
      };
      BigInteger2.prototype.millerRabin = function(t2) {
        var n1 = this.subtract(BigInteger2.ONE);
        var k = n1.getLowestSetBit();
        if (k <= 0) {
          return false;
        }
        var r = n1.shiftRight(k);
        t2 = t2 + 1 >> 1;
        if (t2 > lowprimes.length) {
          t2 = lowprimes.length;
        }
        var a = nbi();
        for (var i = 0; i < t2; ++i) {
          a.fromInt(lowprimes[Math.floor(Math.random() * lowprimes.length)]);
          var y = a.modPow(r, this);
          if (y.compareTo(BigInteger2.ONE) != 0 && y.compareTo(n1) != 0) {
            var j = 1;
            while (j++ < k && y.compareTo(n1) != 0) {
              y = y.modPowInt(2, this);
              if (y.compareTo(BigInteger2.ONE) == 0) {
                return false;
              }
            }
            if (y.compareTo(n1) != 0) {
              return false;
            }
          }
        }
        return true;
      };
      BigInteger2.prototype.square = function() {
        var r = nbi();
        this.squareTo(r);
        return r;
      };
      BigInteger2.prototype.gcda = function(a, callback) {
        var x = this.s < 0 ? this.negate() : this.clone();
        var y = a.s < 0 ? a.negate() : a.clone();
        if (x.compareTo(y) < 0) {
          var t2 = x;
          x = y;
          y = t2;
        }
        var i = x.getLowestSetBit();
        var g = y.getLowestSetBit();
        if (g < 0) {
          callback(x);
          return;
        }
        if (i < g) {
          g = i;
        }
        if (g > 0) {
          x.rShiftTo(g, x);
          y.rShiftTo(g, y);
        }
        var gcda1 = function() {
          if ((i = x.getLowestSetBit()) > 0) {
            x.rShiftTo(i, x);
          }
          if ((i = y.getLowestSetBit()) > 0) {
            y.rShiftTo(i, y);
          }
          if (x.compareTo(y) >= 0) {
            x.subTo(y, x);
            x.rShiftTo(1, x);
          } else {
            y.subTo(x, y);
            y.rShiftTo(1, y);
          }
          if (!(x.signum() > 0)) {
            if (g > 0) {
              y.lShiftTo(g, y);
            }
            setTimeout(function() {
              callback(y);
            }, 0);
          } else {
            setTimeout(gcda1, 0);
          }
        };
        setTimeout(gcda1, 10);
      };
      BigInteger2.prototype.fromNumberAsync = function(a, b, c, callback) {
        if ("number" == typeof b) {
          if (a < 2) {
            this.fromInt(1);
          } else {
            this.fromNumber(a, c);
            if (!this.testBit(a - 1)) {
              this.bitwiseTo(BigInteger2.ONE.shiftLeft(a - 1), op_or, this);
            }
            if (this.isEven()) {
              this.dAddOffset(1, 0);
            }
            var bnp_1 = this;
            var bnpfn1_1 = function() {
              bnp_1.dAddOffset(2, 0);
              if (bnp_1.bitLength() > a) {
                bnp_1.subTo(BigInteger2.ONE.shiftLeft(a - 1), bnp_1);
              }
              if (bnp_1.isProbablePrime(b)) {
                setTimeout(function() {
                  callback();
                }, 0);
              } else {
                setTimeout(bnpfn1_1, 0);
              }
            };
            setTimeout(bnpfn1_1, 0);
          }
        } else {
          var x = [];
          var t2 = a & 7;
          x.length = (a >> 3) + 1;
          b.nextBytes(x);
          if (t2 > 0) {
            x[0] &= (1 << t2) - 1;
          } else {
            x[0] = 0;
          }
          this.fromString(x, 256);
        }
      };
      return BigInteger2;
    }()
  );
  var NullExp = (
    /** @class */
    function() {
      function NullExp2() {
      }
      NullExp2.prototype.convert = function(x) {
        return x;
      };
      NullExp2.prototype.revert = function(x) {
        return x;
      };
      NullExp2.prototype.mulTo = function(x, y, r) {
        x.multiplyTo(y, r);
      };
      NullExp2.prototype.sqrTo = function(x, r) {
        x.squareTo(r);
      };
      return NullExp2;
    }()
  );
  var Classic = (
    /** @class */
    function() {
      function Classic2(m) {
        this.m = m;
      }
      Classic2.prototype.convert = function(x) {
        if (x.s < 0 || x.compareTo(this.m) >= 0) {
          return x.mod(this.m);
        } else {
          return x;
        }
      };
      Classic2.prototype.revert = function(x) {
        return x;
      };
      Classic2.prototype.reduce = function(x) {
        x.divRemTo(this.m, null, x);
      };
      Classic2.prototype.mulTo = function(x, y, r) {
        x.multiplyTo(y, r);
        this.reduce(r);
      };
      Classic2.prototype.sqrTo = function(x, r) {
        x.squareTo(r);
        this.reduce(r);
      };
      return Classic2;
    }()
  );
  var Montgomery = (
    /** @class */
    function() {
      function Montgomery2(m) {
        this.m = m;
        this.mp = m.invDigit();
        this.mpl = this.mp & 32767;
        this.mph = this.mp >> 15;
        this.um = (1 << m.DB - 15) - 1;
        this.mt2 = 2 * m.t;
      }
      Montgomery2.prototype.convert = function(x) {
        var r = nbi();
        x.abs().dlShiftTo(this.m.t, r);
        r.divRemTo(this.m, null, r);
        if (x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) {
          this.m.subTo(r, r);
        }
        return r;
      };
      Montgomery2.prototype.revert = function(x) {
        var r = nbi();
        x.copyTo(r);
        this.reduce(r);
        return r;
      };
      Montgomery2.prototype.reduce = function(x) {
        while (x.t <= this.mt2) {
          x[x.t++] = 0;
        }
        for (var i = 0; i < this.m.t; ++i) {
          var j = x[i] & 32767;
          var u0 = j * this.mpl + ((j * this.mph + (x[i] >> 15) * this.mpl & this.um) << 15) & x.DM;
          j = i + this.m.t;
          x[j] += this.m.am(0, u0, x, i, 0, this.m.t);
          while (x[j] >= x.DV) {
            x[j] -= x.DV;
            x[++j]++;
          }
        }
        x.clamp();
        x.drShiftTo(this.m.t, x);
        if (x.compareTo(this.m) >= 0) {
          x.subTo(this.m, x);
        }
      };
      Montgomery2.prototype.mulTo = function(x, y, r) {
        x.multiplyTo(y, r);
        this.reduce(r);
      };
      Montgomery2.prototype.sqrTo = function(x, r) {
        x.squareTo(r);
        this.reduce(r);
      };
      return Montgomery2;
    }()
  );
  var Barrett = (
    /** @class */
    function() {
      function Barrett2(m) {
        this.m = m;
        this.r2 = nbi();
        this.q3 = nbi();
        BigInteger.ONE.dlShiftTo(2 * m.t, this.r2);
        this.mu = this.r2.divide(m);
      }
      Barrett2.prototype.convert = function(x) {
        if (x.s < 0 || x.t > 2 * this.m.t) {
          return x.mod(this.m);
        } else if (x.compareTo(this.m) < 0) {
          return x;
        } else {
          var r = nbi();
          x.copyTo(r);
          this.reduce(r);
          return r;
        }
      };
      Barrett2.prototype.revert = function(x) {
        return x;
      };
      Barrett2.prototype.reduce = function(x) {
        x.drShiftTo(this.m.t - 1, this.r2);
        if (x.t > this.m.t + 1) {
          x.t = this.m.t + 1;
          x.clamp();
        }
        this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
        this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
        while (x.compareTo(this.r2) < 0) {
          x.dAddOffset(1, this.m.t + 1);
        }
        x.subTo(this.r2, x);
        while (x.compareTo(this.m) >= 0) {
          x.subTo(this.m, x);
        }
      };
      Barrett2.prototype.mulTo = function(x, y, r) {
        x.multiplyTo(y, r);
        this.reduce(r);
      };
      Barrett2.prototype.sqrTo = function(x, r) {
        x.squareTo(r);
        this.reduce(r);
      };
      return Barrett2;
    }()
  );
  function nbi() {
    return new BigInteger(null);
  }
  function parseBigInt(str, r) {
    return new BigInteger(str, r);
  }
  var inBrowser = typeof navigator !== "undefined";
  if (inBrowser && j_lm && navigator.appName == "Microsoft Internet Explorer") {
    BigInteger.prototype.am = function am2(i, x, w, j, c, n) {
      var xl = x & 32767;
      var xh = x >> 15;
      while (--n >= 0) {
        var l = this[i] & 32767;
        var h = this[i++] >> 15;
        var m = xh * l + h * xl;
        l = xl * l + ((m & 32767) << 15) + w[j] + (c & 1073741823);
        c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
        w[j++] = l & 1073741823;
      }
      return c;
    };
    dbits = 30;
  } else if (inBrowser && j_lm && navigator.appName != "Netscape") {
    BigInteger.prototype.am = function am1(i, x, w, j, c, n) {
      while (--n >= 0) {
        var v = x * this[i++] + w[j] + c;
        c = Math.floor(v / 67108864);
        w[j++] = v & 67108863;
      }
      return c;
    };
    dbits = 26;
  } else {
    BigInteger.prototype.am = function am3(i, x, w, j, c, n) {
      var xl = x & 16383;
      var xh = x >> 14;
      while (--n >= 0) {
        var l = this[i] & 16383;
        var h = this[i++] >> 14;
        var m = xh * l + h * xl;
        l = xl * l + ((m & 16383) << 14) + w[j] + c;
        c = (l >> 28) + (m >> 14) + xh * h;
        w[j++] = l & 268435455;
      }
      return c;
    };
    dbits = 28;
  }
  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = (1 << dbits) - 1;
  BigInteger.prototype.DV = 1 << dbits;
  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2, BI_FP);
  BigInteger.prototype.F1 = BI_FP - dbits;
  BigInteger.prototype.F2 = 2 * dbits - BI_FP;
  var BI_RC = [];
  var rr;
  var vv;
  rr = "0".charCodeAt(0);
  for (vv = 0; vv <= 9; ++vv) {
    BI_RC[rr++] = vv;
  }
  rr = "a".charCodeAt(0);
  for (vv = 10; vv < 36; ++vv) {
    BI_RC[rr++] = vv;
  }
  rr = "A".charCodeAt(0);
  for (vv = 10; vv < 36; ++vv) {
    BI_RC[rr++] = vv;
  }
  function intAt(s, i) {
    var c = BI_RC[s.charCodeAt(i)];
    return c == null ? -1 : c;
  }
  function nbv(i) {
    var r = nbi();
    r.fromInt(i);
    return r;
  }
  function nbits(x) {
    var r = 1;
    var t2;
    if ((t2 = x >>> 16) != 0) {
      x = t2;
      r += 16;
    }
    if ((t2 = x >> 8) != 0) {
      x = t2;
      r += 8;
    }
    if ((t2 = x >> 4) != 0) {
      x = t2;
      r += 4;
    }
    if ((t2 = x >> 2) != 0) {
      x = t2;
      r += 2;
    }
    if ((t2 = x >> 1) != 0) {
      x = t2;
      r += 1;
    }
    return r;
  }
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);
  var lookup = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    62,
    0,
    62,
    0,
    63,
    52,
    53,
    54,
    55,
    56,
    57,
    58,
    59,
    60,
    61,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    0,
    0,
    0,
    0,
    63,
    0,
    26,
    27,
    28,
    29,
    30,
    31,
    32,
    33,
    34,
    35,
    36,
    37,
    38,
    39,
    40,
    41,
    42,
    43,
    44,
    45,
    46,
    47,
    48,
    49,
    50,
    51
  ];
  function base64Decode(source, target) {
    var sourceLength = source.length;
    var paddingLength = source[sourceLength - 2] === "=" ? 2 : source[sourceLength - 1] === "=" ? 1 : 0;
    var tmp;
    var byteIndex = 0;
    var baseLength = sourceLength - paddingLength & 4294967292;
    for (var i = 0; i < baseLength; i += 4) {
      tmp = lookup[source.charCodeAt(i)] << 18 | lookup[source.charCodeAt(i + 1)] << 12 | lookup[source.charCodeAt(i + 2)] << 6 | lookup[source.charCodeAt(i + 3)];
      target[byteIndex++] = tmp >> 16 & 255;
      target[byteIndex++] = tmp >> 8 & 255;
      target[byteIndex++] = tmp & 255;
    }
    if (paddingLength === 1) {
      tmp = lookup[source.charCodeAt(i)] << 10 | lookup[source.charCodeAt(i + 1)] << 4 | lookup[source.charCodeAt(i + 2)] >> 2;
      target[byteIndex++] = tmp >> 8 & 255;
      target[byteIndex++] = tmp & 255;
    }
    if (paddingLength === 2) {
      tmp = lookup[source.charCodeAt(i)] << 2 | lookup[source.charCodeAt(i + 1)] >> 4;
      target[byteIndex++] = tmp & 255;
    }
  }
  const $inject_window_crypto = {
    getRandomValues(arr) {
      if (!(arr instanceof Int8Array || arr instanceof Uint8Array || arr instanceof Int16Array || arr instanceof Uint16Array || arr instanceof Int32Array || arr instanceof Uint32Array || arr instanceof Uint8ClampedArray)) {
        throw new Error("Expected an integer array");
      }
      if (arr.byteLength > 65536) {
        throw new Error("Can only request a maximum of 65536 bytes");
      }
      var crypto = requireNativePlugin("DCloud-Crypto");
      base64Decode(crypto.getRandomValues(arr.byteLength), new Uint8Array(
        arr.buffer,
        arr.byteOffset,
        arr.byteLength
      ));
      return arr;
    }
  };
  var Arcfour = (
    /** @class */
    function() {
      function Arcfour2() {
        this.i = 0;
        this.j = 0;
        this.S = [];
      }
      Arcfour2.prototype.init = function(key) {
        var i;
        var j;
        var t2;
        for (i = 0; i < 256; ++i) {
          this.S[i] = i;
        }
        j = 0;
        for (i = 0; i < 256; ++i) {
          j = j + this.S[i] + key[i % key.length] & 255;
          t2 = this.S[i];
          this.S[i] = this.S[j];
          this.S[j] = t2;
        }
        this.i = 0;
        this.j = 0;
      };
      Arcfour2.prototype.next = function() {
        var t2;
        this.i = this.i + 1 & 255;
        this.j = this.j + this.S[this.i] & 255;
        t2 = this.S[this.i];
        this.S[this.i] = this.S[this.j];
        this.S[this.j] = t2;
        return this.S[t2 + this.S[this.i] & 255];
      };
      return Arcfour2;
    }()
  );
  function prng_newstate() {
    return new Arcfour();
  }
  var rng_psize = 256;
  var rng_state;
  var rng_pool = null;
  var rng_pptr;
  if (rng_pool == null) {
    rng_pool = [];
    rng_pptr = 0;
    var t = void 0;
    if (typeof window !== "undefined" && $inject_window_crypto && $inject_window_crypto.getRandomValues) {
      var z = new Uint32Array(256);
      $inject_window_crypto.getRandomValues(z);
      for (t = 0; t < z.length; ++t) {
        rng_pool[rng_pptr++] = z[t] & 255;
      }
    }
    var count = 0;
    var onMouseMoveListener_1 = function(ev) {
      count = count || 0;
      if (count >= 256 || rng_pptr >= rng_psize) {
        if (window.removeEventListener) {
          window.removeEventListener("mousemove", onMouseMoveListener_1, false);
        } else if (window.detachEvent) {
          window.detachEvent("onmousemove", onMouseMoveListener_1);
        }
        return;
      }
      try {
        var mouseCoordinates = ev.x + ev.y;
        rng_pool[rng_pptr++] = mouseCoordinates & 255;
        count += 1;
      } catch (e) {
      }
    };
    if (typeof window !== "undefined") {
      if (window.addEventListener) {
        window.addEventListener("mousemove", onMouseMoveListener_1, false);
      } else if (window.attachEvent) {
        window.attachEvent("onmousemove", onMouseMoveListener_1);
      }
    }
  }
  function rng_get_byte() {
    if (rng_state == null) {
      rng_state = prng_newstate();
      while (rng_pptr < rng_psize) {
        var random = Math.floor(65536 * Math.random());
        rng_pool[rng_pptr++] = random & 255;
      }
      rng_state.init(rng_pool);
      for (rng_pptr = 0; rng_pptr < rng_pool.length; ++rng_pptr) {
        rng_pool[rng_pptr] = 0;
      }
      rng_pptr = 0;
    }
    return rng_state.next();
  }
  var SecureRandom = (
    /** @class */
    function() {
      function SecureRandom2() {
      }
      SecureRandom2.prototype.nextBytes = function(ba) {
        for (var i = 0; i < ba.length; ++i) {
          ba[i] = rng_get_byte();
        }
      };
      return SecureRandom2;
    }()
  );
  function pkcs1pad1(s, n) {
    if (n < s.length + 22) {
      formatAppLog("error", "at node_modules/jsencrypt/lib/lib/jsbn/rsa.js:23", "Message too long for RSA");
      return null;
    }
    var len = n - s.length - 6;
    var filler = "";
    for (var f = 0; f < len; f += 2) {
      filler += "ff";
    }
    var m = "0001" + filler + "00" + s;
    return parseBigInt(m, 16);
  }
  function pkcs1pad2(s, n) {
    if (n < s.length + 11) {
      formatAppLog("error", "at node_modules/jsencrypt/lib/lib/jsbn/rsa.js:37", "Message too long for RSA");
      return null;
    }
    var ba = [];
    var i = s.length - 1;
    while (i >= 0 && n > 0) {
      var c = s.charCodeAt(i--);
      if (c < 128) {
        ba[--n] = c;
      } else if (c > 127 && c < 2048) {
        ba[--n] = c & 63 | 128;
        ba[--n] = c >> 6 | 192;
      } else {
        ba[--n] = c & 63 | 128;
        ba[--n] = c >> 6 & 63 | 128;
        ba[--n] = c >> 12 | 224;
      }
    }
    ba[--n] = 0;
    var rng = new SecureRandom();
    var x = [];
    while (n > 2) {
      x[0] = 0;
      while (x[0] == 0) {
        rng.nextBytes(x);
      }
      ba[--n] = x[0];
    }
    ba[--n] = 2;
    ba[--n] = 0;
    return new BigInteger(ba);
  }
  var RSAKey = (
    /** @class */
    function() {
      function RSAKey2() {
        this.n = null;
        this.e = 0;
        this.d = null;
        this.p = null;
        this.q = null;
        this.dmp1 = null;
        this.dmq1 = null;
        this.coeff = null;
      }
      RSAKey2.prototype.doPublic = function(x) {
        return x.modPowInt(this.e, this.n);
      };
      RSAKey2.prototype.doPrivate = function(x) {
        if (this.p == null || this.q == null) {
          return x.modPow(this.d, this.n);
        }
        var xp = x.mod(this.p).modPow(this.dmp1, this.p);
        var xq = x.mod(this.q).modPow(this.dmq1, this.q);
        while (xp.compareTo(xq) < 0) {
          xp = xp.add(this.p);
        }
        return xp.subtract(xq).multiply(this.coeff).mod(this.p).multiply(this.q).add(xq);
      };
      RSAKey2.prototype.setPublic = function(N, E) {
        if (N != null && E != null && N.length > 0 && E.length > 0) {
          this.n = parseBigInt(N, 16);
          this.e = parseInt(E, 16);
        } else {
          formatAppLog("error", "at node_modules/jsencrypt/lib/lib/jsbn/rsa.js:114", "Invalid RSA public key");
        }
      };
      RSAKey2.prototype.encrypt = function(text) {
        var maxLength = this.n.bitLength() + 7 >> 3;
        var m = pkcs1pad2(text, maxLength);
        if (m == null) {
          return null;
        }
        var c = this.doPublic(m);
        if (c == null) {
          return null;
        }
        var h = c.toString(16);
        var length = h.length;
        for (var i = 0; i < maxLength * 2 - length; i++) {
          h = "0" + h;
        }
        return h;
      };
      RSAKey2.prototype.setPrivate = function(N, E, D) {
        if (N != null && E != null && N.length > 0 && E.length > 0) {
          this.n = parseBigInt(N, 16);
          this.e = parseInt(E, 16);
          this.d = parseBigInt(D, 16);
        } else {
          formatAppLog("error", "at node_modules/jsencrypt/lib/lib/jsbn/rsa.js:146", "Invalid RSA private key");
        }
      };
      RSAKey2.prototype.setPrivateEx = function(N, E, D, P, Q, DP, DQ, C) {
        if (N != null && E != null && N.length > 0 && E.length > 0) {
          this.n = parseBigInt(N, 16);
          this.e = parseInt(E, 16);
          this.d = parseBigInt(D, 16);
          this.p = parseBigInt(P, 16);
          this.q = parseBigInt(Q, 16);
          this.dmp1 = parseBigInt(DP, 16);
          this.dmq1 = parseBigInt(DQ, 16);
          this.coeff = parseBigInt(C, 16);
        } else {
          formatAppLog("error", "at node_modules/jsencrypt/lib/lib/jsbn/rsa.js:163", "Invalid RSA private key");
        }
      };
      RSAKey2.prototype.generate = function(B, E) {
        var rng = new SecureRandom();
        var qs = B >> 1;
        this.e = parseInt(E, 16);
        var ee = new BigInteger(E, 16);
        for (; ; ) {
          for (; ; ) {
            this.p = new BigInteger(B - qs, 1, rng);
            if (this.p.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) == 0 && this.p.isProbablePrime(10)) {
              break;
            }
          }
          for (; ; ) {
            this.q = new BigInteger(qs, 1, rng);
            if (this.q.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) == 0 && this.q.isProbablePrime(10)) {
              break;
            }
          }
          if (this.p.compareTo(this.q) <= 0) {
            var t2 = this.p;
            this.p = this.q;
            this.q = t2;
          }
          var p1 = this.p.subtract(BigInteger.ONE);
          var q1 = this.q.subtract(BigInteger.ONE);
          var phi = p1.multiply(q1);
          if (phi.gcd(ee).compareTo(BigInteger.ONE) == 0) {
            this.n = this.p.multiply(this.q);
            this.d = ee.modInverse(phi);
            this.dmp1 = this.d.mod(p1);
            this.dmq1 = this.d.mod(q1);
            this.coeff = this.q.modInverse(this.p);
            break;
          }
        }
      };
      RSAKey2.prototype.decrypt = function(ctext) {
        var c = parseBigInt(ctext, 16);
        var m = this.doPrivate(c);
        if (m == null) {
          return null;
        }
        return pkcs1unpad2(m, this.n.bitLength() + 7 >> 3);
      };
      RSAKey2.prototype.generateAsync = function(B, E, callback) {
        var rng = new SecureRandom();
        var qs = B >> 1;
        this.e = parseInt(E, 16);
        var ee = new BigInteger(E, 16);
        var rsa = this;
        var loop1 = function() {
          var loop4 = function() {
            if (rsa.p.compareTo(rsa.q) <= 0) {
              var t2 = rsa.p;
              rsa.p = rsa.q;
              rsa.q = t2;
            }
            var p1 = rsa.p.subtract(BigInteger.ONE);
            var q1 = rsa.q.subtract(BigInteger.ONE);
            var phi = p1.multiply(q1);
            if (phi.gcd(ee).compareTo(BigInteger.ONE) == 0) {
              rsa.n = rsa.p.multiply(rsa.q);
              rsa.d = ee.modInverse(phi);
              rsa.dmp1 = rsa.d.mod(p1);
              rsa.dmq1 = rsa.d.mod(q1);
              rsa.coeff = rsa.q.modInverse(rsa.p);
              setTimeout(function() {
                callback();
              }, 0);
            } else {
              setTimeout(loop1, 0);
            }
          };
          var loop3 = function() {
            rsa.q = nbi();
            rsa.q.fromNumberAsync(qs, 1, rng, function() {
              rsa.q.subtract(BigInteger.ONE).gcda(ee, function(r) {
                if (r.compareTo(BigInteger.ONE) == 0 && rsa.q.isProbablePrime(10)) {
                  setTimeout(loop4, 0);
                } else {
                  setTimeout(loop3, 0);
                }
              });
            });
          };
          var loop2 = function() {
            rsa.p = nbi();
            rsa.p.fromNumberAsync(B - qs, 1, rng, function() {
              rsa.p.subtract(BigInteger.ONE).gcda(ee, function(r) {
                if (r.compareTo(BigInteger.ONE) == 0 && rsa.p.isProbablePrime(10)) {
                  setTimeout(loop3, 0);
                } else {
                  setTimeout(loop2, 0);
                }
              });
            });
          };
          setTimeout(loop2, 0);
        };
        setTimeout(loop1, 0);
      };
      RSAKey2.prototype.sign = function(text, digestMethod, digestName) {
        var header = getDigestHeader(digestName);
        var digest = header + digestMethod(text).toString();
        var m = pkcs1pad1(digest, this.n.bitLength() / 4);
        if (m == null) {
          return null;
        }
        var c = this.doPrivate(m);
        if (c == null) {
          return null;
        }
        var h = c.toString(16);
        if ((h.length & 1) == 0) {
          return h;
        } else {
          return "0" + h;
        }
      };
      RSAKey2.prototype.verify = function(text, signature, digestMethod) {
        var c = parseBigInt(signature, 16);
        var m = this.doPublic(c);
        if (m == null) {
          return null;
        }
        var unpadded = m.toString(16).replace(/^1f+00/, "");
        var digest = removeDigestHeader(unpadded);
        return digest == digestMethod(text).toString();
      };
      return RSAKey2;
    }()
  );
  function pkcs1unpad2(d, n) {
    var b = d.toByteArray();
    var i = 0;
    while (i < b.length && b[i] == 0) {
      ++i;
    }
    if (b.length - i != n - 1 || b[i] != 2) {
      return null;
    }
    ++i;
    while (b[i] != 0) {
      if (++i >= b.length) {
        return null;
      }
    }
    var ret = "";
    while (++i < b.length) {
      var c = b[i] & 255;
      if (c < 128) {
        ret += String.fromCharCode(c);
      } else if (c > 191 && c < 224) {
        ret += String.fromCharCode((c & 31) << 6 | b[i + 1] & 63);
        ++i;
      } else {
        ret += String.fromCharCode((c & 15) << 12 | (b[i + 1] & 63) << 6 | b[i + 2] & 63);
        i += 2;
      }
    }
    return ret;
  }
  var DIGEST_HEADERS = {
    md2: "3020300c06082a864886f70d020205000410",
    md5: "3020300c06082a864886f70d020505000410",
    sha1: "3021300906052b0e03021a05000414",
    sha224: "302d300d06096086480165030402040500041c",
    sha256: "3031300d060960864801650304020105000420",
    sha384: "3041300d060960864801650304020205000430",
    sha512: "3051300d060960864801650304020305000440",
    ripemd160: "3021300906052b2403020105000414"
  };
  function getDigestHeader(name) {
    return DIGEST_HEADERS[name] || "";
  }
  function removeDigestHeader(str) {
    for (var name_1 in DIGEST_HEADERS) {
      if (DIGEST_HEADERS.hasOwnProperty(name_1)) {
        var header = DIGEST_HEADERS[name_1];
        var len = header.length;
        if (str.substr(0, len) == header) {
          return str.substr(len);
        }
      }
    }
    return str;
  }
  /*!
  Copyright (c) 2011, Yahoo! Inc. All rights reserved.
  Code licensed under the BSD License:
  http://developer.yahoo.com/yui/license.html
  version: 2.9.0
  */
  var YAHOO = {};
  YAHOO.lang = {
    /**
     * Utility to set up the prototype, constructor and superclass properties to
     * support an inheritance strategy that can chain constructors and methods.
     * Static members will not be inherited.
     *
     * @method extend
     * @static
     * @param {Function} subc   the object to modify
     * @param {Function} superc the object to inherit
     * @param {Object} overrides  additional properties/methods to add to the
     *                              subclass prototype.  These will override the
     *                              matching items obtained from the superclass
     *                              if present.
     */
    extend: function(subc, superc, overrides) {
      if (!superc || !subc) {
        throw new Error("YAHOO.lang.extend failed, please check that all dependencies are included.");
      }
      var F = function() {
      };
      F.prototype = superc.prototype;
      subc.prototype = new F();
      subc.prototype.constructor = subc;
      subc.superclass = superc.prototype;
      if (superc.prototype.constructor == Object.prototype.constructor) {
        superc.prototype.constructor = superc;
      }
      if (overrides) {
        var i;
        for (i in overrides) {
          subc.prototype[i] = overrides[i];
        }
        var _IEEnumFix = function() {
        }, ADD = ["toString", "valueOf"];
        try {
          if (/MSIE/.test(navigator.userAgent)) {
            _IEEnumFix = function(r, s) {
              for (i = 0; i < ADD.length; i = i + 1) {
                var fname = ADD[i], f = s[fname];
                if (typeof f === "function" && f != Object.prototype[fname]) {
                  r[fname] = f;
                }
              }
            };
          }
        } catch (ex) {
        }
        _IEEnumFix(subc.prototype, overrides);
      }
    }
  };
  /**
   * @fileOverview
   * @name asn1-1.0.js
   * @author Kenji Urushima kenji.urushima@gmail.com
   * @version asn1 1.0.13 (2017-Jun-02)
   * @since jsrsasign 2.1
   * @license <a href="https://kjur.github.io/jsrsasign/license/">MIT License</a>
   */
  var KJUR = {};
  if (typeof KJUR.asn1 == "undefined" || !KJUR.asn1)
    KJUR.asn1 = {};
  KJUR.asn1.ASN1Util = new function() {
    this.integerToByteHex = function(i) {
      var h = i.toString(16);
      if (h.length % 2 == 1)
        h = "0" + h;
      return h;
    };
    this.bigIntToMinTwosComplementsHex = function(bigIntegerValue) {
      var h = bigIntegerValue.toString(16);
      if (h.substr(0, 1) != "-") {
        if (h.length % 2 == 1) {
          h = "0" + h;
        } else {
          if (!h.match(/^[0-7]/)) {
            h = "00" + h;
          }
        }
      } else {
        var hPos = h.substr(1);
        var xorLen = hPos.length;
        if (xorLen % 2 == 1) {
          xorLen += 1;
        } else {
          if (!h.match(/^[0-7]/)) {
            xorLen += 2;
          }
        }
        var hMask = "";
        for (var i = 0; i < xorLen; i++) {
          hMask += "f";
        }
        var biMask = new BigInteger(hMask, 16);
        var biNeg = biMask.xor(bigIntegerValue).add(BigInteger.ONE);
        h = biNeg.toString(16).replace(/^-/, "");
      }
      return h;
    };
    this.getPEMStringFromHex = function(dataHex, pemHeader) {
      return hextopem(dataHex, pemHeader);
    };
    this.newObject = function(param) {
      var _KJUR = KJUR, _KJUR_asn1 = _KJUR.asn1, _DERBoolean = _KJUR_asn1.DERBoolean, _DERInteger = _KJUR_asn1.DERInteger, _DERBitString = _KJUR_asn1.DERBitString, _DEROctetString = _KJUR_asn1.DEROctetString, _DERNull = _KJUR_asn1.DERNull, _DERObjectIdentifier = _KJUR_asn1.DERObjectIdentifier, _DEREnumerated = _KJUR_asn1.DEREnumerated, _DERUTF8String = _KJUR_asn1.DERUTF8String, _DERNumericString = _KJUR_asn1.DERNumericString, _DERPrintableString = _KJUR_asn1.DERPrintableString, _DERTeletexString = _KJUR_asn1.DERTeletexString, _DERIA5String = _KJUR_asn1.DERIA5String, _DERUTCTime = _KJUR_asn1.DERUTCTime, _DERGeneralizedTime = _KJUR_asn1.DERGeneralizedTime, _DERSequence = _KJUR_asn1.DERSequence, _DERSet = _KJUR_asn1.DERSet, _DERTaggedObject = _KJUR_asn1.DERTaggedObject, _newObject = _KJUR_asn1.ASN1Util.newObject;
      var keys = Object.keys(param);
      if (keys.length != 1)
        throw "key of param shall be only one.";
      var key = keys[0];
      if (":bool:int:bitstr:octstr:null:oid:enum:utf8str:numstr:prnstr:telstr:ia5str:utctime:gentime:seq:set:tag:".indexOf(":" + key + ":") == -1)
        throw "undefined key: " + key;
      if (key == "bool")
        return new _DERBoolean(param[key]);
      if (key == "int")
        return new _DERInteger(param[key]);
      if (key == "bitstr")
        return new _DERBitString(param[key]);
      if (key == "octstr")
        return new _DEROctetString(param[key]);
      if (key == "null")
        return new _DERNull(param[key]);
      if (key == "oid")
        return new _DERObjectIdentifier(param[key]);
      if (key == "enum")
        return new _DEREnumerated(param[key]);
      if (key == "utf8str")
        return new _DERUTF8String(param[key]);
      if (key == "numstr")
        return new _DERNumericString(param[key]);
      if (key == "prnstr")
        return new _DERPrintableString(param[key]);
      if (key == "telstr")
        return new _DERTeletexString(param[key]);
      if (key == "ia5str")
        return new _DERIA5String(param[key]);
      if (key == "utctime")
        return new _DERUTCTime(param[key]);
      if (key == "gentime")
        return new _DERGeneralizedTime(param[key]);
      if (key == "seq") {
        var paramList = param[key];
        var a = [];
        for (var i = 0; i < paramList.length; i++) {
          var asn1Obj = _newObject(paramList[i]);
          a.push(asn1Obj);
        }
        return new _DERSequence({ "array": a });
      }
      if (key == "set") {
        var paramList = param[key];
        var a = [];
        for (var i = 0; i < paramList.length; i++) {
          var asn1Obj = _newObject(paramList[i]);
          a.push(asn1Obj);
        }
        return new _DERSet({ "array": a });
      }
      if (key == "tag") {
        var tagParam = param[key];
        if (Object.prototype.toString.call(tagParam) === "[object Array]" && tagParam.length == 3) {
          var obj = _newObject(tagParam[2]);
          return new _DERTaggedObject({
            tag: tagParam[0],
            explicit: tagParam[1],
            obj
          });
        } else {
          var newParam = {};
          if (tagParam.explicit !== void 0)
            newParam.explicit = tagParam.explicit;
          if (tagParam.tag !== void 0)
            newParam.tag = tagParam.tag;
          if (tagParam.obj === void 0)
            throw "obj shall be specified for 'tag'.";
          newParam.obj = _newObject(tagParam.obj);
          return new _DERTaggedObject(newParam);
        }
      }
    };
    this.jsonToASN1HEX = function(param) {
      var asn1Obj = this.newObject(param);
      return asn1Obj.getEncodedHex();
    };
  }();
  KJUR.asn1.ASN1Util.oidHexToInt = function(hex) {
    var s = "";
    var i01 = parseInt(hex.substr(0, 2), 16);
    var i0 = Math.floor(i01 / 40);
    var i1 = i01 % 40;
    var s = i0 + "." + i1;
    var binbuf = "";
    for (var i = 2; i < hex.length; i += 2) {
      var value = parseInt(hex.substr(i, 2), 16);
      var bin = ("00000000" + value.toString(2)).slice(-8);
      binbuf = binbuf + bin.substr(1, 7);
      if (bin.substr(0, 1) == "0") {
        var bi = new BigInteger(binbuf, 2);
        s = s + "." + bi.toString(10);
        binbuf = "";
      }
    }
    return s;
  };
  KJUR.asn1.ASN1Util.oidIntToHex = function(oidString) {
    var itox = function(i2) {
      var h2 = i2.toString(16);
      if (h2.length == 1)
        h2 = "0" + h2;
      return h2;
    };
    var roidtox = function(roid) {
      var h2 = "";
      var bi = new BigInteger(roid, 10);
      var b = bi.toString(2);
      var padLen = 7 - b.length % 7;
      if (padLen == 7)
        padLen = 0;
      var bPad = "";
      for (var i2 = 0; i2 < padLen; i2++)
        bPad += "0";
      b = bPad + b;
      for (var i2 = 0; i2 < b.length - 1; i2 += 7) {
        var b8 = b.substr(i2, 7);
        if (i2 != b.length - 7)
          b8 = "1" + b8;
        h2 += itox(parseInt(b8, 2));
      }
      return h2;
    };
    if (!oidString.match(/^[0-9.]+$/)) {
      throw "malformed oid string: " + oidString;
    }
    var h = "";
    var a = oidString.split(".");
    var i0 = parseInt(a[0]) * 40 + parseInt(a[1]);
    h += itox(i0);
    a.splice(0, 2);
    for (var i = 0; i < a.length; i++) {
      h += roidtox(a[i]);
    }
    return h;
  };
  KJUR.asn1.ASN1Object = function() {
    var hV = "";
    this.getLengthHexFromValue = function() {
      if (typeof this.hV == "undefined" || this.hV == null) {
        throw "this.hV is null or undefined.";
      }
      if (this.hV.length % 2 == 1) {
        throw "value hex must be even length: n=" + hV.length + ",v=" + this.hV;
      }
      var n = this.hV.length / 2;
      var hN = n.toString(16);
      if (hN.length % 2 == 1) {
        hN = "0" + hN;
      }
      if (n < 128) {
        return hN;
      } else {
        var hNlen = hN.length / 2;
        if (hNlen > 15) {
          throw "ASN.1 length too long to represent by 8x: n = " + n.toString(16);
        }
        var head = 128 + hNlen;
        return head.toString(16) + hN;
      }
    };
    this.getEncodedHex = function() {
      if (this.hTLV == null || this.isModified) {
        this.hV = this.getFreshValueHex();
        this.hL = this.getLengthHexFromValue();
        this.hTLV = this.hT + this.hL + this.hV;
        this.isModified = false;
      }
      return this.hTLV;
    };
    this.getValueHex = function() {
      this.getEncodedHex();
      return this.hV;
    };
    this.getFreshValueHex = function() {
      return "";
    };
  };
  KJUR.asn1.DERAbstractString = function(params) {
    KJUR.asn1.DERAbstractString.superclass.constructor.call(this);
    this.getString = function() {
      return this.s;
    };
    this.setString = function(newS) {
      this.hTLV = null;
      this.isModified = true;
      this.s = newS;
      this.hV = stohex(this.s);
    };
    this.setStringHex = function(newHexString) {
      this.hTLV = null;
      this.isModified = true;
      this.s = null;
      this.hV = newHexString;
    };
    this.getFreshValueHex = function() {
      return this.hV;
    };
    if (typeof params != "undefined") {
      if (typeof params == "string") {
        this.setString(params);
      } else if (typeof params["str"] != "undefined") {
        this.setString(params["str"]);
      } else if (typeof params["hex"] != "undefined") {
        this.setStringHex(params["hex"]);
      }
    }
  };
  YAHOO.lang.extend(KJUR.asn1.DERAbstractString, KJUR.asn1.ASN1Object);
  KJUR.asn1.DERAbstractTime = function(params) {
    KJUR.asn1.DERAbstractTime.superclass.constructor.call(this);
    this.localDateToUTC = function(d) {
      utc = d.getTime() + d.getTimezoneOffset() * 6e4;
      var utcDate = new Date(utc);
      return utcDate;
    };
    this.formatDate = function(dateObject, type, withMillis) {
      var pad = this.zeroPadding;
      var d = this.localDateToUTC(dateObject);
      var year = String(d.getFullYear());
      if (type == "utc")
        year = year.substr(2, 2);
      var month = pad(String(d.getMonth() + 1), 2);
      var day = pad(String(d.getDate()), 2);
      var hour = pad(String(d.getHours()), 2);
      var min = pad(String(d.getMinutes()), 2);
      var sec = pad(String(d.getSeconds()), 2);
      var s = year + month + day + hour + min + sec;
      if (withMillis === true) {
        var millis = d.getMilliseconds();
        if (millis != 0) {
          var sMillis = pad(String(millis), 3);
          sMillis = sMillis.replace(/[0]+$/, "");
          s = s + "." + sMillis;
        }
      }
      return s + "Z";
    };
    this.zeroPadding = function(s, len) {
      if (s.length >= len)
        return s;
      return new Array(len - s.length + 1).join("0") + s;
    };
    this.getString = function() {
      return this.s;
    };
    this.setString = function(newS) {
      this.hTLV = null;
      this.isModified = true;
      this.s = newS;
      this.hV = stohex(newS);
    };
    this.setByDateValue = function(year, month, day, hour, min, sec) {
      var dateObject = new Date(Date.UTC(year, month - 1, day, hour, min, sec, 0));
      this.setByDate(dateObject);
    };
    this.getFreshValueHex = function() {
      return this.hV;
    };
  };
  YAHOO.lang.extend(KJUR.asn1.DERAbstractTime, KJUR.asn1.ASN1Object);
  KJUR.asn1.DERAbstractStructured = function(params) {
    KJUR.asn1.DERAbstractString.superclass.constructor.call(this);
    this.setByASN1ObjectArray = function(asn1ObjectArray) {
      this.hTLV = null;
      this.isModified = true;
      this.asn1Array = asn1ObjectArray;
    };
    this.appendASN1Object = function(asn1Object) {
      this.hTLV = null;
      this.isModified = true;
      this.asn1Array.push(asn1Object);
    };
    this.asn1Array = new Array();
    if (typeof params != "undefined") {
      if (typeof params["array"] != "undefined") {
        this.asn1Array = params["array"];
      }
    }
  };
  YAHOO.lang.extend(KJUR.asn1.DERAbstractStructured, KJUR.asn1.ASN1Object);
  KJUR.asn1.DERBoolean = function() {
    KJUR.asn1.DERBoolean.superclass.constructor.call(this);
    this.hT = "01";
    this.hTLV = "0101ff";
  };
  YAHOO.lang.extend(KJUR.asn1.DERBoolean, KJUR.asn1.ASN1Object);
  KJUR.asn1.DERInteger = function(params) {
    KJUR.asn1.DERInteger.superclass.constructor.call(this);
    this.hT = "02";
    this.setByBigInteger = function(bigIntegerValue) {
      this.hTLV = null;
      this.isModified = true;
      this.hV = KJUR.asn1.ASN1Util.bigIntToMinTwosComplementsHex(bigIntegerValue);
    };
    this.setByInteger = function(intValue) {
      var bi = new BigInteger(String(intValue), 10);
      this.setByBigInteger(bi);
    };
    this.setValueHex = function(newHexString) {
      this.hV = newHexString;
    };
    this.getFreshValueHex = function() {
      return this.hV;
    };
    if (typeof params != "undefined") {
      if (typeof params["bigint"] != "undefined") {
        this.setByBigInteger(params["bigint"]);
      } else if (typeof params["int"] != "undefined") {
        this.setByInteger(params["int"]);
      } else if (typeof params == "number") {
        this.setByInteger(params);
      } else if (typeof params["hex"] != "undefined") {
        this.setValueHex(params["hex"]);
      }
    }
  };
  YAHOO.lang.extend(KJUR.asn1.DERInteger, KJUR.asn1.ASN1Object);
  KJUR.asn1.DERBitString = function(params) {
    if (params !== void 0 && typeof params.obj !== "undefined") {
      var o = KJUR.asn1.ASN1Util.newObject(params.obj);
      params.hex = "00" + o.getEncodedHex();
    }
    KJUR.asn1.DERBitString.superclass.constructor.call(this);
    this.hT = "03";
    this.setHexValueIncludingUnusedBits = function(newHexStringIncludingUnusedBits) {
      this.hTLV = null;
      this.isModified = true;
      this.hV = newHexStringIncludingUnusedBits;
    };
    this.setUnusedBitsAndHexValue = function(unusedBits, hValue) {
      if (unusedBits < 0 || 7 < unusedBits) {
        throw "unused bits shall be from 0 to 7: u = " + unusedBits;
      }
      var hUnusedBits = "0" + unusedBits;
      this.hTLV = null;
      this.isModified = true;
      this.hV = hUnusedBits + hValue;
    };
    this.setByBinaryString = function(binaryString) {
      binaryString = binaryString.replace(/0+$/, "");
      var unusedBits = 8 - binaryString.length % 8;
      if (unusedBits == 8)
        unusedBits = 0;
      for (var i = 0; i <= unusedBits; i++) {
        binaryString += "0";
      }
      var h = "";
      for (var i = 0; i < binaryString.length - 1; i += 8) {
        var b = binaryString.substr(i, 8);
        var x = parseInt(b, 2).toString(16);
        if (x.length == 1)
          x = "0" + x;
        h += x;
      }
      this.hTLV = null;
      this.isModified = true;
      this.hV = "0" + unusedBits + h;
    };
    this.setByBooleanArray = function(booleanArray) {
      var s = "";
      for (var i = 0; i < booleanArray.length; i++) {
        if (booleanArray[i] == true) {
          s += "1";
        } else {
          s += "0";
        }
      }
      this.setByBinaryString(s);
    };
    this.newFalseArray = function(nLength) {
      var a = new Array(nLength);
      for (var i = 0; i < nLength; i++) {
        a[i] = false;
      }
      return a;
    };
    this.getFreshValueHex = function() {
      return this.hV;
    };
    if (typeof params != "undefined") {
      if (typeof params == "string" && params.toLowerCase().match(/^[0-9a-f]+$/)) {
        this.setHexValueIncludingUnusedBits(params);
      } else if (typeof params["hex"] != "undefined") {
        this.setHexValueIncludingUnusedBits(params["hex"]);
      } else if (typeof params["bin"] != "undefined") {
        this.setByBinaryString(params["bin"]);
      } else if (typeof params["array"] != "undefined") {
        this.setByBooleanArray(params["array"]);
      }
    }
  };
  YAHOO.lang.extend(KJUR.asn1.DERBitString, KJUR.asn1.ASN1Object);
  KJUR.asn1.DEROctetString = function(params) {
    if (params !== void 0 && typeof params.obj !== "undefined") {
      var o = KJUR.asn1.ASN1Util.newObject(params.obj);
      params.hex = o.getEncodedHex();
    }
    KJUR.asn1.DEROctetString.superclass.constructor.call(this, params);
    this.hT = "04";
  };
  YAHOO.lang.extend(KJUR.asn1.DEROctetString, KJUR.asn1.DERAbstractString);
  KJUR.asn1.DERNull = function() {
    KJUR.asn1.DERNull.superclass.constructor.call(this);
    this.hT = "05";
    this.hTLV = "0500";
  };
  YAHOO.lang.extend(KJUR.asn1.DERNull, KJUR.asn1.ASN1Object);
  KJUR.asn1.DERObjectIdentifier = function(params) {
    var itox = function(i) {
      var h = i.toString(16);
      if (h.length == 1)
        h = "0" + h;
      return h;
    };
    var roidtox = function(roid) {
      var h = "";
      var bi = new BigInteger(roid, 10);
      var b = bi.toString(2);
      var padLen = 7 - b.length % 7;
      if (padLen == 7)
        padLen = 0;
      var bPad = "";
      for (var i = 0; i < padLen; i++)
        bPad += "0";
      b = bPad + b;
      for (var i = 0; i < b.length - 1; i += 7) {
        var b8 = b.substr(i, 7);
        if (i != b.length - 7)
          b8 = "1" + b8;
        h += itox(parseInt(b8, 2));
      }
      return h;
    };
    KJUR.asn1.DERObjectIdentifier.superclass.constructor.call(this);
    this.hT = "06";
    this.setValueHex = function(newHexString) {
      this.hTLV = null;
      this.isModified = true;
      this.s = null;
      this.hV = newHexString;
    };
    this.setValueOidString = function(oidString) {
      if (!oidString.match(/^[0-9.]+$/)) {
        throw "malformed oid string: " + oidString;
      }
      var h = "";
      var a = oidString.split(".");
      var i0 = parseInt(a[0]) * 40 + parseInt(a[1]);
      h += itox(i0);
      a.splice(0, 2);
      for (var i = 0; i < a.length; i++) {
        h += roidtox(a[i]);
      }
      this.hTLV = null;
      this.isModified = true;
      this.s = null;
      this.hV = h;
    };
    this.setValueName = function(oidName) {
      var oid = KJUR.asn1.x509.OID.name2oid(oidName);
      if (oid !== "") {
        this.setValueOidString(oid);
      } else {
        throw "DERObjectIdentifier oidName undefined: " + oidName;
      }
    };
    this.getFreshValueHex = function() {
      return this.hV;
    };
    if (params !== void 0) {
      if (typeof params === "string") {
        if (params.match(/^[0-2].[0-9.]+$/)) {
          this.setValueOidString(params);
        } else {
          this.setValueName(params);
        }
      } else if (params.oid !== void 0) {
        this.setValueOidString(params.oid);
      } else if (params.hex !== void 0) {
        this.setValueHex(params.hex);
      } else if (params.name !== void 0) {
        this.setValueName(params.name);
      }
    }
  };
  YAHOO.lang.extend(KJUR.asn1.DERObjectIdentifier, KJUR.asn1.ASN1Object);
  KJUR.asn1.DEREnumerated = function(params) {
    KJUR.asn1.DEREnumerated.superclass.constructor.call(this);
    this.hT = "0a";
    this.setByBigInteger = function(bigIntegerValue) {
      this.hTLV = null;
      this.isModified = true;
      this.hV = KJUR.asn1.ASN1Util.bigIntToMinTwosComplementsHex(bigIntegerValue);
    };
    this.setByInteger = function(intValue) {
      var bi = new BigInteger(String(intValue), 10);
      this.setByBigInteger(bi);
    };
    this.setValueHex = function(newHexString) {
      this.hV = newHexString;
    };
    this.getFreshValueHex = function() {
      return this.hV;
    };
    if (typeof params != "undefined") {
      if (typeof params["int"] != "undefined") {
        this.setByInteger(params["int"]);
      } else if (typeof params == "number") {
        this.setByInteger(params);
      } else if (typeof params["hex"] != "undefined") {
        this.setValueHex(params["hex"]);
      }
    }
  };
  YAHOO.lang.extend(KJUR.asn1.DEREnumerated, KJUR.asn1.ASN1Object);
  KJUR.asn1.DERUTF8String = function(params) {
    KJUR.asn1.DERUTF8String.superclass.constructor.call(this, params);
    this.hT = "0c";
  };
  YAHOO.lang.extend(KJUR.asn1.DERUTF8String, KJUR.asn1.DERAbstractString);
  KJUR.asn1.DERNumericString = function(params) {
    KJUR.asn1.DERNumericString.superclass.constructor.call(this, params);
    this.hT = "12";
  };
  YAHOO.lang.extend(KJUR.asn1.DERNumericString, KJUR.asn1.DERAbstractString);
  KJUR.asn1.DERPrintableString = function(params) {
    KJUR.asn1.DERPrintableString.superclass.constructor.call(this, params);
    this.hT = "13";
  };
  YAHOO.lang.extend(KJUR.asn1.DERPrintableString, KJUR.asn1.DERAbstractString);
  KJUR.asn1.DERTeletexString = function(params) {
    KJUR.asn1.DERTeletexString.superclass.constructor.call(this, params);
    this.hT = "14";
  };
  YAHOO.lang.extend(KJUR.asn1.DERTeletexString, KJUR.asn1.DERAbstractString);
  KJUR.asn1.DERIA5String = function(params) {
    KJUR.asn1.DERIA5String.superclass.constructor.call(this, params);
    this.hT = "16";
  };
  YAHOO.lang.extend(KJUR.asn1.DERIA5String, KJUR.asn1.DERAbstractString);
  KJUR.asn1.DERUTCTime = function(params) {
    KJUR.asn1.DERUTCTime.superclass.constructor.call(this, params);
    this.hT = "17";
    this.setByDate = function(dateObject) {
      this.hTLV = null;
      this.isModified = true;
      this.date = dateObject;
      this.s = this.formatDate(this.date, "utc");
      this.hV = stohex(this.s);
    };
    this.getFreshValueHex = function() {
      if (typeof this.date == "undefined" && typeof this.s == "undefined") {
        this.date = /* @__PURE__ */ new Date();
        this.s = this.formatDate(this.date, "utc");
        this.hV = stohex(this.s);
      }
      return this.hV;
    };
    if (params !== void 0) {
      if (params.str !== void 0) {
        this.setString(params.str);
      } else if (typeof params == "string" && params.match(/^[0-9]{12}Z$/)) {
        this.setString(params);
      } else if (params.hex !== void 0) {
        this.setStringHex(params.hex);
      } else if (params.date !== void 0) {
        this.setByDate(params.date);
      }
    }
  };
  YAHOO.lang.extend(KJUR.asn1.DERUTCTime, KJUR.asn1.DERAbstractTime);
  KJUR.asn1.DERGeneralizedTime = function(params) {
    KJUR.asn1.DERGeneralizedTime.superclass.constructor.call(this, params);
    this.hT = "18";
    this.withMillis = false;
    this.setByDate = function(dateObject) {
      this.hTLV = null;
      this.isModified = true;
      this.date = dateObject;
      this.s = this.formatDate(this.date, "gen", this.withMillis);
      this.hV = stohex(this.s);
    };
    this.getFreshValueHex = function() {
      if (this.date === void 0 && this.s === void 0) {
        this.date = /* @__PURE__ */ new Date();
        this.s = this.formatDate(this.date, "gen", this.withMillis);
        this.hV = stohex(this.s);
      }
      return this.hV;
    };
    if (params !== void 0) {
      if (params.str !== void 0) {
        this.setString(params.str);
      } else if (typeof params == "string" && params.match(/^[0-9]{14}Z$/)) {
        this.setString(params);
      } else if (params.hex !== void 0) {
        this.setStringHex(params.hex);
      } else if (params.date !== void 0) {
        this.setByDate(params.date);
      }
      if (params.millis === true) {
        this.withMillis = true;
      }
    }
  };
  YAHOO.lang.extend(KJUR.asn1.DERGeneralizedTime, KJUR.asn1.DERAbstractTime);
  KJUR.asn1.DERSequence = function(params) {
    KJUR.asn1.DERSequence.superclass.constructor.call(this, params);
    this.hT = "30";
    this.getFreshValueHex = function() {
      var h = "";
      for (var i = 0; i < this.asn1Array.length; i++) {
        var asn1Obj = this.asn1Array[i];
        h += asn1Obj.getEncodedHex();
      }
      this.hV = h;
      return this.hV;
    };
  };
  YAHOO.lang.extend(KJUR.asn1.DERSequence, KJUR.asn1.DERAbstractStructured);
  KJUR.asn1.DERSet = function(params) {
    KJUR.asn1.DERSet.superclass.constructor.call(this, params);
    this.hT = "31";
    this.sortFlag = true;
    this.getFreshValueHex = function() {
      var a = new Array();
      for (var i = 0; i < this.asn1Array.length; i++) {
        var asn1Obj = this.asn1Array[i];
        a.push(asn1Obj.getEncodedHex());
      }
      if (this.sortFlag == true)
        a.sort();
      this.hV = a.join("");
      return this.hV;
    };
    if (typeof params != "undefined") {
      if (typeof params.sortflag != "undefined" && params.sortflag == false)
        this.sortFlag = false;
    }
  };
  YAHOO.lang.extend(KJUR.asn1.DERSet, KJUR.asn1.DERAbstractStructured);
  KJUR.asn1.DERTaggedObject = function(params) {
    KJUR.asn1.DERTaggedObject.superclass.constructor.call(this);
    this.hT = "a0";
    this.hV = "";
    this.isExplicit = true;
    this.asn1Object = null;
    this.setASN1Object = function(isExplicitFlag, tagNoHex, asn1Object) {
      this.hT = tagNoHex;
      this.isExplicit = isExplicitFlag;
      this.asn1Object = asn1Object;
      if (this.isExplicit) {
        this.hV = this.asn1Object.getEncodedHex();
        this.hTLV = null;
        this.isModified = true;
      } else {
        this.hV = null;
        this.hTLV = asn1Object.getEncodedHex();
        this.hTLV = this.hTLV.replace(/^../, tagNoHex);
        this.isModified = false;
      }
    };
    this.getFreshValueHex = function() {
      return this.hV;
    };
    if (typeof params != "undefined") {
      if (typeof params["tag"] != "undefined") {
        this.hT = params["tag"];
      }
      if (typeof params["explicit"] != "undefined") {
        this.isExplicit = params["explicit"];
      }
      if (typeof params["obj"] != "undefined") {
        this.asn1Object = params["obj"];
        this.setASN1Object(this.isExplicit, this.hT, this.asn1Object);
      }
    }
  };
  YAHOO.lang.extend(KJUR.asn1.DERTaggedObject, KJUR.asn1.ASN1Object);
  var __extends = /* @__PURE__ */ function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
  }();
  var JSEncryptRSAKey = (
    /** @class */
    function(_super) {
      __extends(JSEncryptRSAKey2, _super);
      function JSEncryptRSAKey2(key) {
        var _this = _super.call(this) || this;
        if (key) {
          if (typeof key === "string") {
            _this.parseKey(key);
          } else if (JSEncryptRSAKey2.hasPrivateKeyProperty(key) || JSEncryptRSAKey2.hasPublicKeyProperty(key)) {
            _this.parsePropertiesFrom(key);
          }
        }
        return _this;
      }
      JSEncryptRSAKey2.prototype.parseKey = function(pem) {
        try {
          var modulus = 0;
          var public_exponent = 0;
          var reHex = /^\s*(?:[0-9A-Fa-f][0-9A-Fa-f]\s*)+$/;
          var der = reHex.test(pem) ? Hex.decode(pem) : Base64.unarmor(pem);
          var asn1 = ASN1.decode(der);
          if (asn1.sub.length === 3) {
            asn1 = asn1.sub[2].sub[0];
          }
          if (asn1.sub.length === 9) {
            modulus = asn1.sub[1].getHexStringValue();
            this.n = parseBigInt(modulus, 16);
            public_exponent = asn1.sub[2].getHexStringValue();
            this.e = parseInt(public_exponent, 16);
            var private_exponent = asn1.sub[3].getHexStringValue();
            this.d = parseBigInt(private_exponent, 16);
            var prime1 = asn1.sub[4].getHexStringValue();
            this.p = parseBigInt(prime1, 16);
            var prime2 = asn1.sub[5].getHexStringValue();
            this.q = parseBigInt(prime2, 16);
            var exponent1 = asn1.sub[6].getHexStringValue();
            this.dmp1 = parseBigInt(exponent1, 16);
            var exponent2 = asn1.sub[7].getHexStringValue();
            this.dmq1 = parseBigInt(exponent2, 16);
            var coefficient = asn1.sub[8].getHexStringValue();
            this.coeff = parseBigInt(coefficient, 16);
          } else if (asn1.sub.length === 2) {
            if (asn1.sub[0].sub) {
              var bit_string = asn1.sub[1];
              var sequence = bit_string.sub[0];
              modulus = sequence.sub[0].getHexStringValue();
              this.n = parseBigInt(modulus, 16);
              public_exponent = sequence.sub[1].getHexStringValue();
              this.e = parseInt(public_exponent, 16);
            } else {
              modulus = asn1.sub[0].getHexStringValue();
              this.n = parseBigInt(modulus, 16);
              public_exponent = asn1.sub[1].getHexStringValue();
              this.e = parseInt(public_exponent, 16);
            }
          } else {
            return false;
          }
          return true;
        } catch (ex) {
          return false;
        }
      };
      JSEncryptRSAKey2.prototype.getPrivateBaseKey = function() {
        var options = {
          array: [
            new KJUR.asn1.DERInteger({ int: 0 }),
            new KJUR.asn1.DERInteger({ bigint: this.n }),
            new KJUR.asn1.DERInteger({ int: this.e }),
            new KJUR.asn1.DERInteger({ bigint: this.d }),
            new KJUR.asn1.DERInteger({ bigint: this.p }),
            new KJUR.asn1.DERInteger({ bigint: this.q }),
            new KJUR.asn1.DERInteger({ bigint: this.dmp1 }),
            new KJUR.asn1.DERInteger({ bigint: this.dmq1 }),
            new KJUR.asn1.DERInteger({ bigint: this.coeff })
          ]
        };
        var seq = new KJUR.asn1.DERSequence(options);
        return seq.getEncodedHex();
      };
      JSEncryptRSAKey2.prototype.getPrivateBaseKeyB64 = function() {
        return hex2b64(this.getPrivateBaseKey());
      };
      JSEncryptRSAKey2.prototype.getPublicBaseKey = function() {
        var first_sequence = new KJUR.asn1.DERSequence({
          array: [
            new KJUR.asn1.DERObjectIdentifier({ oid: "1.2.840.113549.1.1.1" }),
            new KJUR.asn1.DERNull()
          ]
        });
        var second_sequence = new KJUR.asn1.DERSequence({
          array: [
            new KJUR.asn1.DERInteger({ bigint: this.n }),
            new KJUR.asn1.DERInteger({ int: this.e })
          ]
        });
        var bit_string = new KJUR.asn1.DERBitString({
          hex: "00" + second_sequence.getEncodedHex()
        });
        var seq = new KJUR.asn1.DERSequence({
          array: [first_sequence, bit_string]
        });
        return seq.getEncodedHex();
      };
      JSEncryptRSAKey2.prototype.getPublicBaseKeyB64 = function() {
        return hex2b64(this.getPublicBaseKey());
      };
      JSEncryptRSAKey2.wordwrap = function(str, width) {
        width = width || 64;
        if (!str) {
          return str;
        }
        var regex = "(.{1," + width + "})( +|$\n?)|(.{1," + width + "})";
        return str.match(RegExp(regex, "g")).join("\n");
      };
      JSEncryptRSAKey2.prototype.getPrivateKey = function() {
        var key = "-----BEGIN RSA PRIVATE KEY-----\n";
        key += JSEncryptRSAKey2.wordwrap(this.getPrivateBaseKeyB64()) + "\n";
        key += "-----END RSA PRIVATE KEY-----";
        return key;
      };
      JSEncryptRSAKey2.prototype.getPublicKey = function() {
        var key = "-----BEGIN PUBLIC KEY-----\n";
        key += JSEncryptRSAKey2.wordwrap(this.getPublicBaseKeyB64()) + "\n";
        key += "-----END PUBLIC KEY-----";
        return key;
      };
      JSEncryptRSAKey2.hasPublicKeyProperty = function(obj) {
        obj = obj || {};
        return obj.hasOwnProperty("n") && obj.hasOwnProperty("e");
      };
      JSEncryptRSAKey2.hasPrivateKeyProperty = function(obj) {
        obj = obj || {};
        return obj.hasOwnProperty("n") && obj.hasOwnProperty("e") && obj.hasOwnProperty("d") && obj.hasOwnProperty("p") && obj.hasOwnProperty("q") && obj.hasOwnProperty("dmp1") && obj.hasOwnProperty("dmq1") && obj.hasOwnProperty("coeff");
      };
      JSEncryptRSAKey2.prototype.parsePropertiesFrom = function(obj) {
        this.n = obj.n;
        this.e = obj.e;
        if (obj.hasOwnProperty("d")) {
          this.d = obj.d;
          this.p = obj.p;
          this.q = obj.q;
          this.dmp1 = obj.dmp1;
          this.dmq1 = obj.dmq1;
          this.coeff = obj.coeff;
        }
      };
      return JSEncryptRSAKey2;
    }(RSAKey)
  );
  var define_process_env_default = {};
  var _a;
  var version = typeof process !== "undefined" ? (_a = define_process_env_default) === null || _a === void 0 ? void 0 : _a.npm_package_version : void 0;
  var JSEncrypt = (
    /** @class */
    function() {
      function JSEncrypt2(options) {
        if (options === void 0) {
          options = {};
        }
        options = options || {};
        this.default_key_size = options.default_key_size ? parseInt(options.default_key_size, 10) : 1024;
        this.default_public_exponent = options.default_public_exponent || "010001";
        this.log = options.log || false;
        this.key = null;
      }
      JSEncrypt2.prototype.setKey = function(key) {
        if (this.log && this.key) {
          formatAppLog("warn", "at node_modules/jsencrypt/lib/JSEncrypt.js:37", "A key was already set, overriding existing.");
        }
        this.key = new JSEncryptRSAKey(key);
      };
      JSEncrypt2.prototype.setPrivateKey = function(privkey) {
        this.setKey(privkey);
      };
      JSEncrypt2.prototype.setPublicKey = function(pubkey) {
        this.setKey(pubkey);
      };
      JSEncrypt2.prototype.decrypt = function(str) {
        try {
          return this.getKey().decrypt(b64tohex(str));
        } catch (ex) {
          return false;
        }
      };
      JSEncrypt2.prototype.encrypt = function(str) {
        try {
          return hex2b64(this.getKey().encrypt(str));
        } catch (ex) {
          return false;
        }
      };
      JSEncrypt2.prototype.sign = function(str, digestMethod, digestName) {
        try {
          return hex2b64(this.getKey().sign(str, digestMethod, digestName));
        } catch (ex) {
          return false;
        }
      };
      JSEncrypt2.prototype.verify = function(str, signature, digestMethod) {
        try {
          return this.getKey().verify(str, b64tohex(signature), digestMethod);
        } catch (ex) {
          return false;
        }
      };
      JSEncrypt2.prototype.getKey = function(cb) {
        if (!this.key) {
          this.key = new JSEncryptRSAKey();
          if (cb && {}.toString.call(cb) === "[object Function]") {
            this.key.generateAsync(this.default_key_size, this.default_public_exponent, cb);
            return;
          }
          this.key.generate(this.default_key_size, this.default_public_exponent);
        }
        return this.key;
      };
      JSEncrypt2.prototype.getPrivateKey = function() {
        return this.getKey().getPrivateKey();
      };
      JSEncrypt2.prototype.getPrivateKeyB64 = function() {
        return this.getKey().getPrivateBaseKeyB64();
      };
      JSEncrypt2.prototype.getPublicKey = function() {
        return this.getKey().getPublicKey();
      };
      JSEncrypt2.prototype.getPublicKeyB64 = function() {
        return this.getKey().getPublicBaseKeyB64();
      };
      JSEncrypt2.version = version;
      return JSEncrypt2;
    }()
  );
  const BASE_URL = "https://larsc.hzau.edu.cn/prod-api";
  const request = (options) => {
    formatAppLog("log", "at components/request.js:5", "Request options:", options);
    return new Promise((resolve, reject) => {
      var _a2, _b;
      let url = BASE_URL + options.url;
      if (options.method === "GET" && options.data) {
        let queryString = "";
        for (const key in options.data) {
          if (options.data[key] !== void 0 && options.data[key] !== null) {
            if (queryString) {
              queryString += "&";
            }
            queryString += `${key}=${encodeURIComponent(options.data[key])}`;
          }
        }
        if (queryString) {
          url += (url.includes("?") ? "&" : "?") + queryString;
        }
      }
      uni.request({
        url,
        method: options.method || "GET",
        data: options.method !== "GET" ? options.data : void 0,
        // GET请求不传data
        header: {
          ...options.headers,
          "Authorization": (_b = (_a2 = options.headers) == null ? void 0 : _a2.Authorization) == null ? void 0 : _b.trim()
          // 确保没有多余空格
        },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else {
            reject(new Error(`请求失败，状态码：${res.statusCode}`));
          }
        },
        fail: (err) => {
          reject(new Error(`网络错误：${err.errMsg}`));
        }
      });
    });
  };
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$a = {
    data() {
      return {
        username: "",
        password: "",
        isLoading: false
      };
    },
    methods: {
      handleUsernameInput(e) {
        const maxLength = 20;
        if (e.detail.value.length > maxLength) {
          this.username = e.detail.value.slice(0, maxLength);
          uni.showToast({
            title: `用户名不能超过${maxLength}位`,
            icon: "none"
          });
        }
      },
      handlePasswordInput(e) {
        const maxLength = 32;
        if (e.detail.value.length > maxLength) {
          this.password = e.detail.value.slice(0, maxLength);
          uni.showToast({
            title: `密码不能超过${maxLength}位`,
            icon: "none"
          });
        }
      },
      async login() {
        try {
          if (!this.username) {
            uni.showToast({ title: "请输入用户名", icon: "none" });
            return;
          }
          if (!this.password) {
            uni.showToast({ title: "请输入密码", icon: "none" });
            return;
          }
          const publicKeyRes = await request({
            url: "/api/v1/auth/publicKey",
            method: "GET"
          });
          const publicKey = publicKeyRes.data;
          if (!publicKey) {
            throw new Error("获取公钥失败");
          }
          const encryptor = new JSEncrypt();
          encryptor.setPublicKey(publicKey);
          const encryptedPwd = encryptor.encrypt(this.password);
          if (!encryptedPwd) {
            throw new Error("密码加密失败");
          }
          const queryString = `username=${encodeURIComponent(this.username)}&password=${encodeURIComponent(encryptedPwd)}`;
          const loginRes = await request({
            url: `/api/v1/auth/login?${queryString}`,
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            }
          });
          if (loginRes.code === "00000") {
            uni.setStorageSync("token", loginRes.data.accessToken);
            uni.setStorageSync("username", this.username);
            uni.showToast({ title: "登录成功", icon: "none" });
            setTimeout(() => {
              uni.reLaunch({ url: "/pages/index/index" });
            }, 500);
          } else {
            throw new Error(loginRes.msg || "登录失败");
          }
        } catch (error) {
          formatAppLog("error", "at pages/login/login.vue:124", "登录出错:", error);
          uni.showToast({
            title: error.message || "登录失败，请重试",
            icon: "none"
          });
        }
      },
      gooffline() {
        uni.reLaunch({
          url: "/pages/offline/offline"
        });
      }
    }
  };
  function _sfc_render$a(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { style: { "height": "100vh", "background": "#fff" } }, [
      vue.createElementVNode("view", { class: "img-a" }, [
        vue.createElementVNode("view", { class: "t-b" }, [
          vue.createTextVNode(" 您好， "),
          vue.createElementVNode("br"),
          vue.createTextVNode(" 欢迎使用狮山云瞳小程序 "),
          vue.createElementVNode("view", { class: "sub-title" }, "病害检测专用版")
        ])
      ]),
      vue.createElementVNode("view", {
        class: "login-view",
        style: {}
      }, [
        vue.createElementVNode("view", { class: "t-login" }, [
          vue.createElementVNode("form", { class: "cl" }, [
            vue.createElementVNode("view", { class: "t-a" }, [
              vue.createElementVNode("text", { class: "txt" }, "用户名"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  type: "text",
                  name: "username",
                  placeholder: "请输入您的用户名",
                  maxlength: "99",
                  "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.username = $event),
                  onInput: _cache[1] || (_cache[1] = (...args) => $options.handleUsernameInput && $options.handleUsernameInput(...args))
                },
                null,
                544
                /* NEED_HYDRATION, NEED_PATCH */
              ), [
                [vue.vModelText, $data.username]
              ])
            ]),
            vue.createElementVNode("view", { class: "t-a" }, [
              vue.createElementVNode("text", { class: "txt" }, "密码"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  type: "password",
                  name: "password",
                  maxlength: "99",
                  placeholder: "请输入您的密码",
                  "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.password = $event),
                  onInput: _cache[3] || (_cache[3] = (...args) => $options.handlePasswordInput && $options.handlePasswordInput(...args))
                },
                null,
                544
                /* NEED_HYDRATION, NEED_PATCH */
              ), [
                [vue.vModelText, $data.password]
              ])
            ]),
            vue.createElementVNode("button", {
              onClick: _cache[4] || (_cache[4] = ($event) => $options.login())
            }, "登 录"),
            vue.createElementVNode("button", {
              onClick: _cache[5] || (_cache[5] = ($event) => $options.gooffline()),
              class: "off"
            }, "去离线")
          ])
        ])
      ])
    ]);
  }
  const PagesLoginLogin = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["render", _sfc_render$a], ["__scopeId", "data-v-e4e4508d"], ["__file", "D:/WeChat Files/wxid_7gwua196xhea12/FileStorage/File/2025-07/狮山云瞳 2/pages/login/login.vue"]]);
  const _sfc_main$9 = {
    props: {
      current: String
    },
    data() {
      return {
        home: "/static/tabs/home.png",
        homeActive: "/static/tabs/home-active.png",
        msg: "/static/tabs/member.png",
        msgActive: "/static/tabs/member-active.png"
      };
    },
    methods: {
      goTo(page) {
        if (this.current !== page) {
          uni.reLaunch({ url: `/pages/${page}/${page}` });
        }
      }
    }
  };
  function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "tab-bar" }, [
      vue.createElementVNode("view", {
        class: "tab-item",
        onClick: _cache[0] || (_cache[0] = ($event) => $options.goTo("index"))
      }, [
        vue.createElementVNode("image", {
          src: $props.current === "index" ? $data.homeActive : $data.home
        }, null, 8, ["src"]),
        vue.createElementVNode(
          "text",
          {
            class: vue.normalizeClass({ active: $props.current === "index" })
          },
          "任务",
          2
          /* CLASS */
        )
      ]),
      vue.createElementVNode("view", {
        class: "tab-item",
        onClick: _cache[1] || (_cache[1] = ($event) => $options.goTo("message"))
      }, [
        vue.createElementVNode("image", {
          src: $props.current === "message" ? $data.msgActive : $data.msg
        }, null, 8, ["src"]),
        vue.createElementVNode(
          "text",
          {
            class: vue.normalizeClass({ active: $props.current === "message" })
          },
          "我的",
          2
          /* CLASS */
        )
      ])
    ]);
  }
  const CustomTabBar = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$9], ["__scopeId", "data-v-c497a889"], ["__file", "D:/WeChat Files/wxid_7gwua196xhea12/FileStorage/File/2025-07/狮山云瞳 2/components/tabBar/tabBar.vue"]]);
  const _sfc_main$8 = {
    components: {
      CustomTabBar
    },
    data() {
      return {
        taskCategories: [
          {
            id: 2,
            name: "病害叶片采集",
            value: "roast",
            tasks: [],
            loading: false,
            error: null
          }
        ],
        activeCategoryId: null,
        showAddTask: false,
        newTaskName: "",
        taskCounter: 4,
        showDeleteModal: false,
        deleteTaskName: "",
        deleteTaskIndex: -1,
        deleteTaskId: null,
        token: uni.getStorageSync("token")
      };
    },
    methods: {
      async toggleCategory(categoryId) {
        if (this.activeCategoryId === categoryId) {
          this.activeCategoryId = null;
          this.showAddTask = false;
          return;
        }
        this.activeCategoryId = categoryId;
        this.showAddTask = false;
        const category = this.taskCategories.find((c) => c.id === categoryId);
        if (!category)
          return;
        if (category.tasks.length > 0 || category.loading)
          return;
        await this.fetchTasks(category);
      },
      async fetchTasks(category) {
        category.loading = true;
        category.error = null;
        if (!this.token) {
          category.error = "未获取到Token，请重新登录";
          category.loading = false;
          return;
        }
        try {
          const res = await request({
            url: "/branchTask/branchTaskList",
            method: "GET",
            headers: {
              "Authorization": this.token,
              "Accept": "*/*"
            },
            data: {
              currentPageCount: 1,
              pageSize: 1e4,
              name: ""
            }
          });
          if (res.code === 200 && res.data && res.data.records) {
            category.tasks = res.data.records.map((record) => ({
              id: record.id,
              name: record.name,
              description: record.name
            }));
          } else {
            throw new Error(res.msg || "获取任务失败");
          }
        } catch (error) {
          formatAppLog("error", "at pages/index/index.vue:150", "错误:", error);
          category.error = error.message || "请求失败，请重试";
        } finally {
          category.loading = false;
        }
      },
      goToDetail(task, typeValue) {
        uni.navigateTo({
          url: `/pages/task-detail/task-detail?id=${task.id}&type=${typeValue}&desc=${encodeURIComponent(task.description)}`
        });
      },
      toggleAddTask() {
        this.showAddTask = !this.showAddTask;
        this.newTaskName = "";
      },
      handleInput() {
      },
      async addTask() {
        if (!this.newTaskName.trim())
          return;
        const category = this.taskCategories.find((c) => c.id === this.activeCategoryId);
        if (!category)
          return;
        try {
          category.loading = true;
          const res = await request({
            url: "/branchTask/add",
            method: "POST",
            headers: {
              "Authorization": this.token,
              "Content-Type": "application/json",
              "Accept": "*/*"
            },
            data: {
              name: this.newTaskName.trim()
            }
          });
          if (res.code === 200) {
            await this.fetchTasks(category);
            this.newTaskName = "";
            this.showAddTask = false;
            uni.showToast({
              title: "添加任务成功",
              icon: "success"
            });
          } else {
            throw new Error(res.msg || "添加任务失败");
          }
        } catch (error) {
          formatAppLog("error", "at pages/index/index.vue:207", "添加任务错误:", error);
          uni.showToast({
            title: error.message || "添加任务失败",
            icon: "none"
          });
        } finally {
          category.loading = false;
        }
      },
      showDeleteConfirm(task, index) {
        this.deleteTaskName = task.name;
        this.deleteTaskIndex = index;
        this.deleteTaskId = task.id;
        this.showDeleteModal = true;
      },
      cancelDelete() {
        this.showDeleteModal = false;
        this.deleteTaskName = "";
        this.deleteTaskIndex = -1;
        this.deleteTaskId = null;
      },
      async confirmDelete() {
        if (!this.token) {
          uni.showToast({ title: "请先登录", icon: "error" });
          return;
        }
        try {
          const res = await request({
            url: `/branchTask/${this.deleteTaskId}`,
            method: "POST",
            headers: {
              "Authorization": this.token,
              "Accept": "*/*",
              "User-Agent": "Apifox/1.0.0",
              "Host": "larsc.hzau.edu.cn",
              "Connection": "keep-alive"
            }
          });
          if (res.code === "A0230") {
            uni.showToast({ title: "登录已过期", icon: "error" });
            uni.navigateTo({ url: "/pages/login/login" });
            return;
          }
          const category = this.taskCategories.find((c) => c.id === this.activeCategoryId);
          if (category) {
            category.tasks.splice(this.deleteTaskIndex, 1);
          }
          uni.showToast({ title: "删除成功", icon: "success" });
        } catch (error) {
          formatAppLog("error", "at pages/index/index.vue:264", "删除失败:", error);
          uni.showToast({ title: "删除失败", icon: "error" });
        } finally {
          this.showDeleteModal = false;
          this.deleteTaskName = "";
          this.deleteTaskIndex = -1;
          this.deleteTaskId = null;
        }
      }
    }
  };
  function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_CustomTabBar = vue.resolveComponent("CustomTabBar");
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createCommentVNode(" 遍历所有任务分类 "),
      (vue.openBlock(true), vue.createElementBlock(
        vue.Fragment,
        null,
        vue.renderList($data.taskCategories, (category) => {
          return vue.openBlock(), vue.createElementBlock("view", {
            key: category.id,
            class: "category-wrapper"
          }, [
            vue.createElementVNode("view", {
              class: "category-card",
              onClick: ($event) => $options.toggleCategory(category.id)
            }, [
              vue.createElementVNode(
                "text",
                { class: "category-title" },
                vue.toDisplayString(category.name),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "view",
                {
                  class: vue.normalizeClass(["arrow", { "is-open": $data.activeCategoryId === category.id }])
                },
                null,
                2
                /* CLASS */
              )
            ], 8, ["onClick"]),
            vue.createCommentVNode(" 任务列表 "),
            $data.activeCategoryId === category.id ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "task-list-container"
            }, [
              category.loading ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "task-card empty"
              }, " 加载中... ")) : !category.tasks || !category.tasks.length ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 1,
                class: "task-card empty"
              }, " 暂无任务 ")) : (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                { key: 2 },
                vue.renderList(category.tasks, (task, index) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    key: task.id,
                    class: "task-card",
                    onClick: ($event) => $options.goToDetail(task, category.value),
                    onLongpress: ($event) => $options.showDeleteConfirm(task, index)
                  }, [
                    vue.createElementVNode(
                      "text",
                      { class: "task-title" },
                      vue.toDisplayString(task.name),
                      1
                      /* TEXT */
                    )
                  ], 40, ["onClick", "onLongpress"]);
                }),
                128
                /* KEYED_FRAGMENT */
              )),
              vue.createCommentVNode(" 添加任务输入框 "),
              $data.showAddTask ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 3,
                class: "add-task-input"
              }, [
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "input-field",
                    "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.newTaskName = $event),
                    placeholder: "输入任务名称",
                    "placeholder-class": "placeholder",
                    focus: "",
                    onInput: _cache[1] || (_cache[1] = (...args) => $options.handleInput && $options.handleInput(...args))
                  },
                  null,
                  544
                  /* NEED_HYDRATION, NEED_PATCH */
                ), [
                  [vue.vModelText, $data.newTaskName]
                ]),
                $data.newTaskName.trim() ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "confirm-btn",
                  onClick: _cache[2] || (_cache[2] = (...args) => $options.addTask && $options.addTask(...args))
                }, [
                  vue.createElementVNode("text", { class: "confirm-icon" }, "✓")
                ])) : vue.createCommentVNode("v-if", true)
              ])) : vue.createCommentVNode("v-if", true),
              vue.createCommentVNode(" 添加任务按钮 "),
              vue.createElementVNode("view", {
                class: "add-task-btn",
                onClick: _cache[3] || (_cache[3] = (...args) => $options.toggleAddTask && $options.toggleAddTask(...args))
              }, [
                vue.createElementVNode("text", { class: "add-icon" }, "+"),
                vue.createElementVNode("text", { class: "add-text" }, "添加任务")
              ])
            ])) : vue.createCommentVNode("v-if", true)
          ]);
        }),
        128
        /* KEYED_FRAGMENT */
      )),
      vue.createCommentVNode(" 删除确认弹窗 "),
      $data.showDeleteModal ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "modal"
      }, [
        vue.createElementVNode("view", { class: "modal-content" }, [
          vue.createElementVNode("view", { class: "modal-body" }, [
            vue.createElementVNode(
              "text",
              null,
              '确定删除任务"' + vue.toDisplayString($data.deleteTaskName) + '"吗？',
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "modal-footer" }, [
            vue.createElementVNode("view", {
              class: "modal-btn cancel",
              onClick: _cache[4] || (_cache[4] = (...args) => $options.cancelDelete && $options.cancelDelete(...args))
            }, "取消"),
            vue.createElementVNode("view", {
              class: "modal-btn confirm",
              onClick: _cache[5] || (_cache[5] = (...args) => $options.confirmDelete && $options.confirmDelete(...args))
            }, "删除")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createVNode(_component_CustomTabBar, { current: "index" })
    ]);
  }
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$8], ["__scopeId", "data-v-1cf27b2a"], ["__file", "D:/WeChat Files/wxid_7gwua196xhea12/FileStorage/File/2025-07/狮山云瞳 2/pages/index/index.vue"]]);
  const _sfc_main$7 = {
    components: { CustomTabBar },
    data() {
      return {
        userInfo: {
          // 从本地存储获取用户名
          username: uni.getStorageSync("username") || "未登录用户"
        }
      };
    },
    methods: {
      uploadRecord() {
        uni.showToast({
          title: "跳转上传记录页面",
          icon: "none"
        });
      },
      logout() {
        uni.showModal({
          title: "提示",
          content: "确认退出登录？",
          success: (res) => {
            if (res.confirm) {
              uni.clearStorageSync();
              uni.reLaunch({ url: "/pages/login/login" });
            }
          }
        });
      }
    }
  };
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_CustomTabBar = vue.resolveComponent("CustomTabBar");
    return vue.openBlock(), vue.createElementBlock(
      vue.Fragment,
      null,
      [
        vue.createElementVNode("view", { class: "container" }, [
          vue.createCommentVNode(" 用户信息部分 "),
          vue.createElementVNode("view", { class: "user-info" }, [
            vue.createCommentVNode(" 头像 "),
            vue.createElementVNode("image", {
              class: "avatar",
              src: "https://example.com/default-avatar.png"
            }),
            vue.createCommentVNode(" 用户名 "),
            vue.createElementVNode(
              "text",
              { class: "username" },
              vue.toDisplayString($data.userInfo.username),
              1
              /* TEXT */
            )
          ]),
          vue.createCommentVNode(" 功能按钮部分 "),
          vue.createElementVNode("view", { class: "function-buttons" }, [
            vue.createElementVNode("button", {
              class: "btn",
              onClick: _cache[0] || (_cache[0] = (...args) => $options.uploadRecord && $options.uploadRecord(...args))
            }, "上传记录"),
            vue.createElementVNode("button", {
              class: "btn btn-danger",
              onClick: _cache[1] || (_cache[1] = (...args) => $options.logout && $options.logout(...args))
            }, "退出登录")
          ])
        ]),
        vue.createVNode(_component_CustomTabBar, { current: "message" })
      ],
      64
      /* STABLE_FRAGMENT */
    );
  }
  const PagesMessageMessage = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$7], ["__scopeId", "data-v-4c1b26cf"], ["__file", "D:/WeChat Files/wxid_7gwua196xhea12/FileStorage/File/2025-07/狮山云瞳 2/pages/message/message.vue"]]);
  const _sfc_main$6 = {
    components: {
      CustomTabBar
    },
    data() {
      return {
        taskCategories: [
          {
            id: 2,
            name: "病害叶片采集",
            value: "roast",
            tasks: [
              {
                id: "blade_0001",
                taskName: "病害叶片采集-2023夏季",
                description: "病害叶片采集-2023夏季"
              }
            ],
            loading: false,
            error: null
          }
        ],
        activeCategoryId: null,
        showAddTask: false,
        newTaskName: "",
        taskCounter: 4,
        showDeleteModal: false,
        deleteTaskName: "",
        deleteTaskIndex: -1
      };
    },
    methods: {
      async toggleCategory(categoryId) {
        if (this.activeCategoryId === categoryId) {
          this.activeCategoryId = null;
          this.showAddTask = false;
          return;
        }
        this.activeCategoryId = categoryId;
        this.showAddTask = false;
        const category = this.taskCategories.find((c) => c.id === categoryId);
        if (!category)
          return;
        if (category.tasks.length > 0 || category.loading)
          return;
        await this.fetchTasks(category);
      },
      async fetchTasks(category) {
        category.loading = true;
        category.error = null;
        try {
          const res = await request({
            url: "/task/getTask",
            method: "GET",
            header: {
              "Authorization": uni.getStorageSync("token") || "",
              "Content-Type": "application/json"
            },
            data: {
              typeId: category.id
            }
          });
          category.tasks = res.data;
        } catch (error) {
          formatAppLog("error", "at pages/task-list/task-list.vue:141", "获取任务失败:", error);
          category.error = error.message || "获取任务失败，请稍后重试";
        } finally {
          category.loading = false;
        }
      },
      goToDetail(task) {
        formatAppLog("log", "at pages/task-list/task-list.vue:149", "即将传递的任务数据:", {
          id: task.id,
          taskName: task.taskName
        });
        uni.navigateTo({
          url: `/pages/task-detail/task-detail?id=${task.id}&taskName=${encodeURIComponent(task.taskName)}`
        });
      },
      toggleAddTask() {
        this.showAddTask = !this.showAddTask;
        this.newTaskName = "";
      },
      handleInput() {
      },
      addTask() {
        if (this.newTaskName.trim()) {
          this.taskCounter++;
          const newId = `blade_${this.taskCounter.toString().padStart(4, "0")}`;
          const category = this.taskCategories.find((c) => c.id === this.activeCategoryId);
          if (category) {
            category.tasks.push({
              id: newId,
              taskName: this.newTaskName,
              description: this.newTaskName
            });
          }
          this.newTaskName = "";
          this.showAddTask = false;
        }
      },
      showDeleteConfirm(task, index) {
        this.deleteTaskName = task.taskName;
        this.deleteTaskIndex = index;
        this.showDeleteModal = true;
      },
      cancelDelete() {
        this.showDeleteModal = false;
        this.deleteTaskName = "";
        this.deleteTaskIndex = -1;
      },
      confirmDelete() {
        if (this.deleteTaskIndex >= 0) {
          const category = this.taskCategories.find((c) => c.id === this.activeCategoryId);
          if (category) {
            category.tasks.splice(this.deleteTaskIndex, 1);
          }
        }
        this.showDeleteModal = false;
        this.deleteTaskName = "";
        this.deleteTaskIndex = -1;
      }
    }
  };
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_CustomTabBar = vue.resolveComponent("CustomTabBar");
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createCommentVNode(" 遍历所有任务分类 "),
      (vue.openBlock(true), vue.createElementBlock(
        vue.Fragment,
        null,
        vue.renderList($data.taskCategories, (category) => {
          return vue.openBlock(), vue.createElementBlock("view", {
            key: category.id,
            class: "category-wrapper"
          }, [
            vue.createElementVNode("view", {
              class: "category-card",
              onClick: ($event) => $options.toggleCategory(category.id)
            }, [
              vue.createElementVNode(
                "text",
                { class: "category-title" },
                vue.toDisplayString(category.name),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "view",
                {
                  class: vue.normalizeClass(["arrow", { "is-open": $data.activeCategoryId === category.id }])
                },
                null,
                2
                /* CLASS */
              )
            ], 8, ["onClick"]),
            vue.createCommentVNode(" 任务列表 "),
            $data.activeCategoryId === category.id ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "task-list-container"
            }, [
              category.loading ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "task-card empty"
              }, " 加载中... ")) : !category.tasks || !category.tasks.length ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 1,
                class: "task-card empty"
              }, " 暂无任务 ")) : (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                { key: 2 },
                vue.renderList(category.tasks, (task, index) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    key: task.id,
                    class: "task-card",
                    onClick: ($event) => $options.goToDetail(task),
                    onLongpress: ($event) => $options.showDeleteConfirm(task, index)
                  }, [
                    vue.createElementVNode(
                      "text",
                      { class: "task-title" },
                      vue.toDisplayString(task.taskName),
                      1
                      /* TEXT */
                    )
                  ], 40, ["onClick", "onLongpress"]);
                }),
                128
                /* KEYED_FRAGMENT */
              )),
              vue.createCommentVNode(" 添加任务输入框 "),
              $data.showAddTask ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 3,
                class: "add-task-input"
              }, [
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "input-field",
                    "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.newTaskName = $event),
                    placeholder: "输入任务名称",
                    "placeholder-class": "placeholder",
                    focus: "",
                    onInput: _cache[1] || (_cache[1] = (...args) => $options.handleInput && $options.handleInput(...args))
                  },
                  null,
                  544
                  /* NEED_HYDRATION, NEED_PATCH */
                ), [
                  [vue.vModelText, $data.newTaskName]
                ]),
                $data.newTaskName.trim() ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "confirm-btn",
                  onClick: _cache[2] || (_cache[2] = (...args) => $options.addTask && $options.addTask(...args))
                }, [
                  vue.createElementVNode("text", { class: "confirm-icon" }, "✓")
                ])) : vue.createCommentVNode("v-if", true)
              ])) : vue.createCommentVNode("v-if", true),
              vue.createCommentVNode(" 添加任务按钮 "),
              vue.createElementVNode("view", {
                class: "add-task-btn",
                onClick: _cache[3] || (_cache[3] = (...args) => $options.toggleAddTask && $options.toggleAddTask(...args))
              }, [
                vue.createElementVNode("text", { class: "add-icon" }, "+"),
                vue.createElementVNode("text", { class: "add-text" }, "添加任务")
              ])
            ])) : vue.createCommentVNode("v-if", true)
          ]);
        }),
        128
        /* KEYED_FRAGMENT */
      )),
      vue.createCommentVNode(" 删除确认弹窗 "),
      $data.showDeleteModal ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "modal"
      }, [
        vue.createElementVNode("view", { class: "modal-content" }, [
          vue.createElementVNode("view", { class: "modal-body" }, [
            vue.createElementVNode(
              "text",
              null,
              '确定删除任务"' + vue.toDisplayString($data.deleteTaskName) + '"吗？',
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "modal-footer" }, [
            vue.createElementVNode("view", {
              class: "modal-btn cancel",
              onClick: _cache[4] || (_cache[4] = (...args) => $options.cancelDelete && $options.cancelDelete(...args))
            }, "取消"),
            vue.createElementVNode("view", {
              class: "modal-btn confirm",
              onClick: _cache[5] || (_cache[5] = (...args) => $options.confirmDelete && $options.confirmDelete(...args))
            }, "删除")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createVNode(_component_CustomTabBar, { current: "index" })
    ]);
  }
  const PagesTaskListTaskList = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$6], ["__scopeId", "data-v-de08e793"], ["__file", "D:/WeChat Files/wxid_7gwua196xhea12/FileStorage/File/2025-07/狮山云瞳 2/pages/task-list/task-list.vue"]]);
  const _sfc_main$5 = {
    data() {
      return {
        task: {
          id: "1937794845536321538",
          taskName: "田间任务调查2",
          position: ""
        },
        plotDescription: "",
        images: [],
        // 新增分页相关数据
        currentPage: 1,
        pageSize: 10,
        // 修改为每页10条记录
        // 其他原有数据
        showNewPlotModal: false,
        showUnuploadedWarning: false,
        newPlotId: "",
        newPlotDesc: "",
        isSubmitting: false,
        baseUrl: "https://larsc.hzau.edu.cn/prod-api",
        // 切换小区相关数据
        showSwitchModal: false,
        loadingCells: false,
        loadError: false,
        errorMessage: "",
        totalCells: 0,
        visibleCells: [],
        // 删除相关数据
        showDeleteDialog: false,
        deleteCellInfo: {},
        isDeleting: false
      };
    },
    computed: {
      // 计算总页数
      totalPages() {
        return Math.ceil(this.totalCells / this.pageSize);
      },
      // 计算当前页显示的图片列表
      filteredImages() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        return this.images.slice(startIndex, endIndex);
      }
    },
    onLoad(options) {
      this.task.id = options.id || this.task.id;
      this.task.taskName = decodeURIComponent(options.desc || this.task.taskName);
      this.loadCells().then(() => {
        if (this.visibleCells.length > 0) {
          const firstCell = this.visibleCells[0];
          this.task.position = firstCell.blockNum;
          this.plotDescription = firstCell.blockName;
          uni.setStorageSync("blockId", firstCell.id);
          uni.setStorageSync("blockNum", firstCell.blockNum);
          this.loadImages();
        }
      });
    },
    onShow() {
      if (uni.getStorageSync("blockId")) {
        this.loadImages();
      }
    },
    methods: {
      // 修改后的loadImages方法
      async loadImages() {
        var _a2, _b;
        const blockId = uni.getStorageSync("blockId");
        if (!blockId) {
          formatAppLog("error", "at pages/task-detail/task-detail.vue:276", "未获取到blockId");
          return;
        }
        try {
          const token = uni.getStorageSync("token");
          if (!token) {
            throw new Error("用户未登录");
          }
          this.images = [];
          const response = await uni.request({
            url: `${this.baseUrl}/plant-disease/blockList?blockId=${blockId}`,
            method: "GET",
            header: {
              "Authorization": token,
              "Accept": "*/*"
            }
          });
          let res = Array.isArray(response) ? response[0] : response;
          if (res.statusCode === 200 && ((_a2 = res.data) == null ? void 0 : _a2.code) === 200) {
            this.images = (res.data.data || []).map((item) => ({
              ...item,
              imageNum: item.imageNum || `未命名_${item.id}`,
              selected: false
            }));
            this.currentPage = 1;
          } else {
            throw new Error(((_b = res.data) == null ? void 0 : _b.msg) || "加载图片数据失败");
          }
        } catch (error) {
          formatAppLog("error", "at pages/task-detail/task-detail.vue:314", "加载图片数据失败:", error);
          uni.showToast({
            title: error.message || "网络请求失败",
            icon: "none"
          });
        }
      },
      // 修改后的handleRefresh方法
      async handleRefresh() {
        uni.showLoading({ title: "刷新中..." });
        try {
          await this.loadImages();
          uni.showToast({
            title: "刷新成功",
            icon: "success"
          });
        } catch (error) {
          formatAppLog("error", "at pages/task-detail/task-detail.vue:332", "刷新失败:", error);
          uni.showToast({
            title: error.message || "刷新失败",
            icon: "none"
          });
        } finally {
          uni.hideLoading();
        }
      },
      // 修改后的selectCell方法
      selectCell(cell) {
        this.images = [];
        this.task.position = cell.blockNum;
        this.plotDescription = cell.blockName;
        uni.setStorageSync("blockId", cell.id);
        uni.setStorageSync("blockNum", cell.blockNum);
        this.showSwitchModal = false;
        uni.showToast({
          title: `已切换到小区: ${cell.blockNum}`,
          icon: "success"
        });
        this.loadImages();
      },
      async loadImages() {
        var _a2, _b;
        const blockId = uni.getStorageSync("blockId");
        if (!blockId)
          return;
        try {
          const token = uni.getStorageSync("token");
          if (!token) {
            throw new Error("用户未登录");
          }
          const response = await uni.request({
            url: `${this.baseUrl}/plant-disease/blockList?blockId=${blockId}`,
            method: "GET",
            header: {
              "Authorization": token,
              "Accept": "*/*"
            }
          });
          let res = Array.isArray(response) ? response[0] : response;
          if (res.statusCode === 200 && ((_a2 = res.data) == null ? void 0 : _a2.code) === 200) {
            this.images = (res.data.data || []).map((item) => ({
              ...item,
              // 确保imageNum存在，避免undefined
              imageNum: item.imageNum || `未命名_${item.id}`
            }));
          } else {
            throw new Error(((_b = res.data) == null ? void 0 : _b.msg) || "加载图片数据失败");
          }
        } catch (error) {
          formatAppLog("error", "at pages/task-detail/task-detail.vue:394", "加载图片数据失败:", error);
          uni.showToast({
            title: error.message || "网络请求失败",
            icon: "none"
          });
        }
      },
      goBack() {
        uni.navigateBack();
      },
      toggleSelect(img) {
        img.selected = !img.selected;
      },
      getStatusText(status) {
        const map = {
          new: "新建",
          started: "进行中",
          ended: "已完成",
          uploaded: "已上传",
          notUploaded: "未上传"
        };
        return map[status] || status;
      },
      // 查看单张图片详情
      viewImageDetail(img) {
        if (!img.imageNum) {
          uni.showToast({
            title: "图片编号不存在",
            icon: "none"
          });
          return;
        }
        uni.navigateTo({
          url: `/pages/result/result?taskId=${this.task.id}&taskName=${this.task.taskName}&plotId=${img.blockId || ""}&plotName=${img.blockName || ""}&imgId=${img.imageNum}&branchTaskId=${this.task.id}&blockId=${img.blockId || ""}&imageNum=${img.imageNum}`
        });
      },
      handleView() {
        const selected = this.images.filter((img) => img.selected);
        if (selected.length !== 1) {
          uni.showToast({
            title: "请选择一张图片查看",
            icon: "none"
          });
          return;
        }
        this.viewImageDetail(selected[0]);
      },
      async handleDelete() {
        const selected = this.images.filter((img) => img.selected);
        if (selected.length === 0) {
          uni.showToast({
            title: "请先选择要删除的图片",
            icon: "none"
          });
          return;
        }
        uni.showModal({
          title: "确认删除",
          content: `确定要删除选中的${selected.length}张图片吗？`,
          success: async (res) => {
            var _a2;
            if (res.confirm) {
              const token = uni.getStorageSync("token");
              if (!token) {
                uni.showToast({
                  title: "请先登录",
                  icon: "none"
                });
                return;
              }
              for (const img of selected) {
                try {
                  const response = await uni.request({
                    url: `${this.baseUrl}/plant-disease/${img.id}`,
                    method: "POST",
                    header: {
                      "Authorization": token,
                      "Accept": "*/*"
                    }
                  });
                  let res2 = Array.isArray(response) ? response[0] : response;
                  if (res2.statusCode === 200) {
                    formatAppLog("log", "at pages/task-detail/task-detail.vue:496", `图片 ${img.id} 删除成功`);
                  } else {
                    throw new Error(((_a2 = res2.data) == null ? void 0 : _a2.msg) || "删除图片失败");
                  }
                } catch (error) {
                  formatAppLog("error", "at pages/task-detail/task-detail.vue:501", `删除图片 ${img.id} 失败:`, error);
                  uni.showToast({
                    title: error.message || "删除图片失败",
                    icon: "none"
                  });
                }
              }
              await this.loadImages();
              uni.showToast({ title: "删除成功" });
            }
          }
        });
      },
      goToCollect() {
        uni.setStorageSync("branchTaskId", this.task.id);
        uni.setStorageSync("branchTaskName", this.task.taskName);
        uni.setStorageSync("blockNum", this.task.position);
        uni.setStorageSync("blockName", this.plotDescription);
        uni.navigateTo({
          url: `/pages/collect/collect?taskId=${this.task.id}`
        });
      },
      checkUnuploadedImages() {
        return this.images.some((img) => img.status === "notUploaded");
      },
      cancelNewPlot() {
        this.showNewPlotModal = false;
        this.showUnuploadedWarning = false;
        this.newPlotId = "";
        this.newPlotDesc = "";
        this.isSubmitting = false;
      },
      async addNewPlot() {
        var _a2, _b;
        try {
          this.isSubmitting = true;
          const token = uni.getStorageSync("token");
          if (!token) {
            uni.showToast({
              title: "请先登录",
              icon: "none"
            });
            this.isSubmitting = false;
            return;
          }
          const response = await uni.request({
            url: `${this.baseUrl}/block/add`,
            method: "POST",
            header: {
              "Authorization": token,
              "Content-Type": "application/json",
              "Accept": "*/*"
            },
            data: {
              branchTaskId: this.task.id,
              blockNum: this.newPlotId,
              blockName: this.newPlotDesc,
              remark: this.newPlotDesc
            }
          });
          let res = Array.isArray(response) ? response[0] : response;
          if (((_a2 = res.data) == null ? void 0 : _a2.code) === 200) {
            this.task.position = this.newPlotId;
            this.plotDescription = this.newPlotDesc;
            this.images = [];
            uni.showToast({
              title: "小区创建成功",
              icon: "success"
            });
            this.cancelNewPlot();
          } else {
            const errorMsg = ((_b = res.data) == null ? void 0 : _b.msg) || "创建小区失败";
            throw new Error(errorMsg);
          }
        } catch (error) {
          formatAppLog("error", "at pages/task-detail/task-detail.vue:586", "创建小区失败:", error);
          uni.showToast({
            title: error.message || "创建小区失败",
            icon: "none"
          });
        } finally {
          this.isSubmitting = false;
        }
      },
      confirmNewPlot() {
        if (!this.newPlotId) {
          uni.showToast({
            title: "请输入小区编号",
            icon: "none"
          });
          return;
        }
        if (this.checkUnuploadedImages()) {
          this.showNewPlotModal = false;
          this.showUnuploadedWarning = true;
        } else {
          this.addNewPlot();
        }
      },
      forceNewPlot() {
        this.addNewPlot();
      },
      // 切换小区相关方法
      openSwitchModal() {
        this.showSwitchModal = true;
        this.currentPage = 1;
        this.loadCells();
      },
      async loadCells() {
        var _a2, _b;
        this.loadingCells = true;
        this.loadError = false;
        try {
          const token = uni.getStorageSync("token");
          if (!token) {
            throw new Error("用户未登录");
          }
          const params = {
            currentPageCount: this.currentPage,
            pageSize: this.pageSize,
            branchTaskId: this.task.id
          };
          const response = await uni.request({
            url: `${this.baseUrl}/block/blockList`,
            method: "GET",
            header: {
              "Authorization": token,
              "Accept": "*/*"
            },
            data: params
          });
          let res = Array.isArray(response) ? response[0] : response;
          if (res.statusCode === 200 && ((_a2 = res.data) == null ? void 0 : _a2.code) === 200) {
            const apiData = res.data.data;
            this.visibleCells = (apiData.records || []).map((item) => ({
              id: item.id,
              blockNum: item.blockNum,
              blockName: item.blockName,
              remark: item.remark
            }));
            this.totalCells = apiData.total || 0;
          } else {
            throw new Error(((_b = res.data) == null ? void 0 : _b.msg) || "加载小区数据失败");
          }
        } catch (error) {
          formatAppLog("error", "at pages/task-detail/task-detail.vue:666", "加载小区数据失败:", error);
          this.loadError = true;
          this.errorMessage = error.message || "网络请求失败";
          this.visibleCells = [];
        } finally {
          this.loadingCells = false;
        }
      },
      prevPage() {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.loadCells();
        }
      },
      nextPage() {
        if (this.currentPage < this.totalPages) {
          this.currentPage++;
          this.loadCells();
        }
      },
      selectCell(cell) {
        this.task.position = cell.blockNum;
        this.plotDescription = cell.blockName;
        uni.setStorageSync("blockId", cell.id);
        formatAppLog("log", "at pages/task-detail/task-detail.vue:693", "blockId", cell.id);
        uni.setStorageSync("blockNum", cell.blockNum);
        formatAppLog("log", "at pages/task-detail/task-detail.vue:695", "blockNum", cell.blockNum);
        this.showSwitchModal = false;
        uni.showToast({
          title: `已切换到小区: ${cell.blockNum}`,
          icon: "success"
        });
        this.loadImages();
      },
      // 显示删除确认
      showDeleteConfirm(cell, index) {
        uni.vibrateShort();
        this.deleteCellInfo = cell;
        this.showDeleteDialog = true;
      },
      // 确认删除小区
      async confirmDeleteCell() {
        var _a2;
        if (this.isDeleting)
          return;
        try {
          this.isDeleting = true;
          const token = uni.getStorageSync("token");
          const response = await uni.request({
            url: `${this.baseUrl}/block/${this.deleteCellInfo.id}`,
            method: "POST",
            header: {
              "Authorization": token,
              "Accept": "*/*"
            }
          });
          let res = Array.isArray(response) ? response[0] : response;
          if (res.statusCode === 200) {
            uni.showToast({
              title: "删除成功",
              icon: "success"
            });
            this.loadCells();
            if (this.task.position === this.deleteCellInfo.blockNum) {
              this.task.position = "";
              this.plotDescription = "";
            }
          } else {
            throw new Error(((_a2 = res.data) == null ? void 0 : _a2.msg) || "删除失败");
          }
        } catch (error) {
          formatAppLog("error", "at pages/task-detail/task-detail.vue:747", "删除小区失败:", error);
          uni.showToast({
            title: error.message || "删除失败",
            icon: "none"
          });
        } finally {
          this.isDeleting = false;
          this.showDeleteDialog = false;
        }
      }
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createCommentVNode(" 顶部导航 "),
      vue.createElementVNode("view", { class: "nav-bar" }, [
        vue.createElementVNode("view", {
          class: "nav-left",
          onClick: _cache[0] || (_cache[0] = (...args) => $options.goBack && $options.goBack(...args))
        }, [
          vue.createElementVNode("text", { class: "icon" }, "←")
        ]),
        vue.createElementVNode("text", { class: "nav-title" }, "任务详情"),
        vue.createElementVNode("view", { class: "nav-right" }, [
          vue.createElementVNode("text", { class: "icon" }, "⋮⋮")
        ])
      ]),
      vue.createCommentVNode(" 新建小区按钮和切换小区按钮 "),
      vue.createElementVNode("view", { class: "new-plot-btn-container" }, [
        vue.createElementVNode("button", {
          class: "new-plot-btn",
          onClick: _cache[1] || (_cache[1] = ($event) => $data.showNewPlotModal = true)
        }, "新建小区"),
        vue.createElementVNode("button", {
          class: "new-plot-btn switch-plot-btn",
          onClick: _cache[2] || (_cache[2] = (...args) => $options.openSwitchModal && $options.openSwitchModal(...args))
        }, "切换小区")
      ]),
      vue.createCommentVNode(" 任务信息 "),
      vue.createElementVNode("view", { class: "info-card" }, [
        vue.createElementVNode("view", { class: "info-item" }, [
          vue.createElementVNode("text", { class: "info-label" }, "任务ID："),
          vue.createElementVNode(
            "text",
            { class: "info-value" },
            vue.toDisplayString($data.task.id),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "info-item" }, [
          vue.createElementVNode("text", { class: "info-label" }, "任务名称："),
          vue.createElementVNode(
            "text",
            { class: "info-value" },
            vue.toDisplayString($data.task.taskName),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "info-item" }, [
          vue.createElementVNode("text", { class: "info-label" }, "小区编号："),
          vue.createElementVNode(
            "text",
            { class: "info-value" },
            vue.toDisplayString($data.task.position),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "info-item" }, [
          vue.createElementVNode("text", { class: "info-label" }, "小区描述："),
          vue.createElementVNode(
            "text",
            { class: "info-value" },
            vue.toDisplayString($data.plotDescription),
            1
            /* TEXT */
          )
        ])
      ]),
      vue.createCommentVNode(" 图片列表 - 修改为列表形式展示imageNum "),
      vue.createElementVNode("view", { class: "image-list-container" }, [
        vue.createElementVNode("scroll-view", {
          class: "image-list",
          "scroll-y": ""
        }, [
          $options.filteredImages.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "empty-tip"
          }, [
            vue.createElementVNode("text", null, "暂无图片数据")
          ])) : vue.createCommentVNode("v-if", true),
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($options.filteredImages, (img, index) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: img.id,
                class: "image-item",
                onClick: ($event) => $options.toggleSelect(img)
              }, [
                vue.createElementVNode("view", { class: "image-info-list" }, [
                  vue.createElementVNode(
                    "view",
                    { class: "image-status" },
                    vue.toDisplayString($options.getStatusText(img.status)),
                    1
                    /* TEXT */
                  ),
                  vue.createCommentVNode(" 移除点击事件 "),
                  vue.createElementVNode(
                    "view",
                    { class: "image-id" },
                    vue.toDisplayString(img.imageNum || "未获取到编号"),
                    1
                    /* TEXT */
                  ),
                  img.selected ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 0,
                    class: "selected-mask-list"
                  }, [
                    vue.createElementVNode("view", { class: "selected-icon" }, "✓")
                  ])) : vue.createCommentVNode("v-if", true)
                ])
              ], 8, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        vue.createCommentVNode(" 分页控件 "),
        $options.totalPages > 1 ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "pagination"
        }, [
          vue.createElementVNode("button", {
            class: "page-btn prev",
            onClick: _cache[3] || (_cache[3] = (...args) => $options.prevPage && $options.prevPage(...args)),
            disabled: $data.currentPage === 1
          }, "上一页", 8, ["disabled"]),
          vue.createElementVNode(
            "text",
            { class: "page-info" },
            "第 " + vue.toDisplayString($data.currentPage) + " 页 / 共 " + vue.toDisplayString($options.totalPages) + " 页",
            1
            /* TEXT */
          ),
          vue.createElementVNode("button", {
            class: "page-btn next",
            onClick: _cache[4] || (_cache[4] = (...args) => $options.nextPage && $options.nextPage(...args)),
            disabled: $data.currentPage === $options.totalPages
          }, "下一页", 8, ["disabled"])
        ])) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createCommentVNode(" 底部操作栏 "),
      vue.createElementVNode("view", { class: "action-bar" }, [
        vue.createElementVNode("button", {
          class: "action-btn upload",
          onClick: _cache[5] || (_cache[5] = (...args) => $options.handleRefresh && $options.handleRefresh(...args))
        }, "刷新"),
        vue.createElementVNode("button", {
          class: "action-btn view",
          onClick: _cache[6] || (_cache[6] = (...args) => $options.handleView && $options.handleView(...args))
        }, "查看"),
        vue.createElementVNode("button", {
          class: "action-btn delete",
          onClick: _cache[7] || (_cache[7] = (...args) => $options.handleDelete && $options.handleDelete(...args))
        }, "删除"),
        vue.createElementVNode("button", {
          class: "action-btn capture",
          onClick: _cache[8] || (_cache[8] = (...args) => $options.goToCollect && $options.goToCollect(...args))
        }, "采集")
      ]),
      vue.createCommentVNode(" 新建小区弹窗 - 优化样式 "),
      $data.showNewPlotModal ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "modal"
      }, [
        vue.createElementVNode("view", { class: "modal-content new-plot-modal" }, [
          vue.createElementVNode("view", { class: "modal-header" }, [
            vue.createElementVNode("text", { class: "modal-title" }, "新建小区")
          ]),
          vue.createElementVNode("view", { class: "modal-body" }, [
            vue.createElementVNode("view", { class: "form-group" }, [
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("label", { class: "form-label" }, "小区编号："),
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "form-input",
                    "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => $data.newPlotId = $event),
                    placeholder: "请输入小区编号"
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, $data.newPlotId]
                ])
              ]),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("label", { class: "form-label" }, "小区描述："),
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "form-input",
                    "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => $data.newPlotDesc = $event),
                    placeholder: "请输入小区描述"
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, $data.newPlotDesc]
                ])
              ])
            ])
          ]),
          vue.createElementVNode("view", { class: "modal-footer" }, [
            vue.createElementVNode("button", {
              class: "modal-btn cancel",
              onClick: _cache[11] || (_cache[11] = (...args) => $options.cancelNewPlot && $options.cancelNewPlot(...args))
            }, "取消"),
            vue.createElementVNode("button", {
              class: "modal-btn confirm",
              onClick: _cache[12] || (_cache[12] = (...args) => $options.confirmNewPlot && $options.confirmNewPlot(...args)),
              disabled: $data.isSubmitting
            }, [
              !$data.isSubmitting ? (vue.openBlock(), vue.createElementBlock("text", { key: 0 }, "确认")) : (vue.openBlock(), vue.createElementBlock("text", { key: 1 }, "提交中..."))
            ], 8, ["disabled"])
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 未上传图片提示弹窗 "),
      $data.showUnuploadedWarning ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "modal"
      }, [
        vue.createElementVNode("view", { class: "modal-content warning" }, [
          vue.createElementVNode("view", { class: "modal-header" }, [
            vue.createElementVNode("text", { class: "modal-title" }, "提示")
          ]),
          vue.createElementVNode("view", { class: "modal-body" }, [
            vue.createElementVNode("text", null, "当前存在未上传的图片，是否继续新建小区？")
          ]),
          vue.createElementVNode("view", { class: "modal-footer" }, [
            vue.createElementVNode("button", {
              class: "modal-btn cancel",
              onClick: _cache[13] || (_cache[13] = (...args) => $options.cancelNewPlot && $options.cancelNewPlot(...args))
            }, "返回"),
            vue.createElementVNode("button", {
              class: "modal-btn confirm",
              onClick: _cache[14] || (_cache[14] = (...args) => $options.forceNewPlot && $options.forceNewPlot(...args)),
              disabled: $data.isSubmitting
            }, [
              !$data.isSubmitting ? (vue.openBlock(), vue.createElementBlock("text", { key: 0 }, "确认")) : (vue.openBlock(), vue.createElementBlock("text", { key: 1 }, "提交中..."))
            ], 8, ["disabled"])
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 切换小区弹窗 "),
      $data.showSwitchModal ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 2,
        class: "modal"
      }, [
        vue.createElementVNode("view", { class: "modal-content switch-modal" }, [
          vue.createElementVNode("view", { class: "modal-header" }, [
            vue.createElementVNode("text", { class: "modal-title" }, "切换小区")
          ]),
          vue.createElementVNode("view", { class: "modal-body" }, [
            vue.createCommentVNode(" 加载状态提示 "),
            $data.loadingCells ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "loading-tip"
            }, [
              vue.createElementVNode("text", null, "小区数据加载中...")
            ])) : vue.createCommentVNode("v-if", true),
            vue.createCommentVNode(" 错误提示 "),
            $data.loadError ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "error-tip"
            }, [
              vue.createElementVNode(
                "text",
                null,
                vue.toDisplayString($data.errorMessage),
                1
                /* TEXT */
              ),
              vue.createElementVNode("button", {
                class: "retry-btn",
                onClick: _cache[15] || (_cache[15] = (...args) => $options.loadCells && $options.loadCells(...args))
              }, "重试")
            ])) : vue.createCommentVNode("v-if", true),
            vue.createCommentVNode(" 小区列表 "),
            !$data.loadingCells && !$data.loadError ? (vue.openBlock(), vue.createElementBlock("scroll-view", {
              key: 2,
              "scroll-y": "",
              class: "cell-list",
              style: { "height": "500rpx" }
            }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($data.visibleCells, (cell, index) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    key: cell.id,
                    class: "cell-item",
                    onClick: ($event) => $options.selectCell(cell)
                  }, [
                    vue.createElementVNode("view", { class: "cell-info" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "cell-id" },
                        "小区编号：" + vue.toDisplayString(cell.blockNum),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "cell-desc" },
                        "小区描述：" + vue.toDisplayString(cell.blockName),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "cell-actions" }, [
                      vue.createElementVNode("view", { class: "cell-arrow" }),
                      vue.createElementVNode("button", {
                        class: "delete-btn",
                        onClick: vue.withModifiers(($event) => $options.showDeleteConfirm(cell, index), ["stop"])
                      }, "删除", 8, ["onClick"])
                    ])
                  ], 8, ["onClick"]);
                }),
                128
                /* KEYED_FRAGMENT */
              )),
              vue.createCommentVNode(" 空数据提示 "),
              $data.visibleCells.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "empty-tip"
              }, [
                vue.createElementVNode("text", null, "暂无小区数据")
              ])) : vue.createCommentVNode("v-if", true)
            ])) : vue.createCommentVNode("v-if", true),
            vue.createCommentVNode(" 分页控件 "),
            $options.totalPages > 1 ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 3,
              class: "pagination"
            }, [
              vue.createElementVNode("button", {
                class: "page-btn prev",
                onClick: _cache[16] || (_cache[16] = (...args) => $options.prevPage && $options.prevPage(...args)),
                disabled: $data.currentPage === 1
              }, "上一页", 8, ["disabled"]),
              vue.createElementVNode(
                "text",
                { class: "page-info" },
                "第 " + vue.toDisplayString($data.currentPage) + " 页 / 共 " + vue.toDisplayString($options.totalPages) + " 页",
                1
                /* TEXT */
              ),
              vue.createElementVNode("button", {
                class: "page-btn next",
                onClick: _cache[17] || (_cache[17] = (...args) => $options.nextPage && $options.nextPage(...args)),
                disabled: $data.currentPage === $options.totalPages
              }, "下一页", 8, ["disabled"])
            ])) : vue.createCommentVNode("v-if", true)
          ]),
          vue.createElementVNode("view", { class: "modal-footer" }, [
            vue.createElementVNode("button", {
              class: "modal-btn cancel",
              onClick: _cache[18] || (_cache[18] = ($event) => $data.showSwitchModal = false)
            }, "取消")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 删除确认弹窗 "),
      $data.showDeleteDialog ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 3,
        class: "modal"
      }, [
        vue.createElementVNode("view", { class: "modal-content delete-modal" }, [
          vue.createElementVNode("view", { class: "modal-header" }, [
            vue.createElementVNode("text", { class: "modal-title" }, "删除确认")
          ]),
          vue.createElementVNode("view", { class: "modal-body" }, [
            vue.createElementVNode(
              "text",
              null,
              "确定要删除小区 " + vue.toDisplayString($data.deleteCellInfo.blockNum) + " 吗？",
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "modal-footer" }, [
            vue.createElementVNode("button", {
              class: "modal-btn cancel",
              onClick: _cache[19] || (_cache[19] = ($event) => $data.showDeleteDialog = false)
            }, "取消"),
            vue.createElementVNode("button", {
              class: "modal-btn confirm",
              onClick: _cache[20] || (_cache[20] = (...args) => $options.confirmDeleteCell && $options.confirmDeleteCell(...args)),
              disabled: $data.isDeleting
            }, [
              !$data.isDeleting ? (vue.openBlock(), vue.createElementBlock("text", { key: 0 }, "确认删除")) : (vue.openBlock(), vue.createElementBlock("text", { key: 1 }, "删除中..."))
            ], 8, ["disabled"])
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesTaskDetailTaskDetail = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$5], ["__scopeId", "data-v-fb7e27ab"], ["__file", "D:/WeChat Files/wxid_7gwua196xhea12/FileStorage/File/2025-07/狮山云瞳 2/pages/task-detail/task-detail.vue"]]);
  const _sfc_main$4 = {
    data() {
      return {
        showCamera: false,
        imageSrc: "",
        ossUrl: "",
        uploadStatus: "",
        taskId: "",
        locationStatus: "正在获取定位...",
        longitude: "114.1",
        latitude: "30.2",
        diseaseTypes: ["黄叶病", "锈斑病", "其他"],
        diseaseIndex: 0,
        diseaseLevel: "",
        imgId: "",
        sampleId: "",
        // 新增样品编号字段
        remark: "",
        // 备注字段
        uploadedImageUrls: [],
        // 存储上传的图片URL
        blockNum: "",
        // 小区编号
        imageCounter: 1,
        // 图片计数器
        blockId: ""
        // 小区ID
      };
    },
    onLoad(options) {
      this.taskId = options.taskId || "";
      this.getLocation();
      this.initImageId();
    },
    methods: {
      startCamera() {
        this.showCamera = true;
        this.imageSrc = "";
        this.ossUrl = "";
        this.uploadStatus = "";
      },
      takePhoto() {
        const ctx = uni.createCameraContext();
        ctx.takePhoto({
          quality: "high",
          success: (res) => {
            this.imageSrc = res.tempImagePath;
            this.showCamera = false;
            this.getLocation();
          },
          fail: (err) => {
            formatAppLog("error", "at pages/collect/collect.vue:152", "拍照失败:", err);
            uni.showToast({ title: "拍照失败，请重试", icon: "none" });
          }
        });
      },
      cancelCamera() {
        this.showCamera = false;
        uni.navigateBack();
      },
      retakePhoto() {
        this.startCamera();
      },
      getLocation() {
        this.locationStatus = "正在获取定位...";
        uni.getLocation({
          type: "wgs84",
          altitude: true,
          success: (res) => {
            this.longitude = res.longitude.toFixed(6);
            this.latitude = res.latitude.toFixed(6);
            this.locationStatus = "定位成功";
          },
          fail: (err) => {
            formatAppLog("error", "at pages/collect/collect.vue:178", "获取定位失败:", err);
            this.locationStatus = "定位失败";
            this.longitude = "114.353280";
            this.latitude = "30.477193";
            this.remark = "无";
          }
        });
      },
      onDiseaseChange(e) {
        const selectedIndex = e.detail.value;
        if (selectedIndex >= 0 && selectedIndex < this.diseaseTypes.length) {
          this.diseaseIndex = selectedIndex;
        } else {
          formatAppLog("warn", "at pages/collect/collect.vue:192", "无效的病害类型选择:", selectedIndex);
          this.diseaseIndex = 0;
        }
      },
      chooseFromAlbum() {
        uni.chooseImage({
          count: 1,
          success: (res) => {
            this.imageSrc = res.tempFilePaths[0];
            this.initImageId();
            this.getLocation();
          }
        });
      },
      // 初始化图片编号
      initImageId() {
        this.blockId = uni.getStorageSync("blockId") || "";
        this.blockNum = uni.getStorageSync("blockNum") || "unknown";
        if (!this.blockNum || this.blockNum === "unknown") {
          this.imgId = "unknown_001";
          return;
        }
        const counterKey = `imageCounter_${this.blockNum}`;
        this.imageCounter = uni.getStorageSync(counterKey) || 1;
        this.imgId = `${this.blockNum}_${this.imageCounter.toString().padStart(3, "0")}`;
      },
      // 确认上传图片
      async confirmImage() {
        var _a2;
        if (!this.validateForm())
          return;
        try {
          uni.showLoading({ title: "上传数据中...", mask: true });
          const token = uni.getStorageSync("token") || "";
          formatAppLog("log", "at pages/collect/collect.vue:235", "【调试】token:", token);
          const branchTaskId = uni.getStorageSync("branchTaskId");
          formatAppLog("log", "at pages/collect/collect.vue:238", "【调试】branchTaskId:", branchTaskId);
          this.blockId = uni.getStorageSync("blockId") || "";
          formatAppLog("log", "at pages/collect/collect.vue:242", "【调试】blockId:", this.blockId);
          const blockName = uni.getStorageSync("blockName");
          formatAppLog("log", "at pages/collect/collect.vue:245", "【调试】blockName:", blockName);
          const combinedRemark = `${this.sampleId || ""}#${this.remark || ""}`;
          const uploadPicRes = await uni.uploadFile({
            url: "https://larsc.hzau.edu.cn/prod-api/plant-disease/uploadPic",
            filePath: this.imageSrc,
            name: "file",
            header: {
              "Authorization": token
            }
          });
          formatAppLog("log", "at pages/collect/collect.vue:259", "【调试】uploadPicRes原始响应:", uploadPicRes);
          if (uploadPicRes.statusCode !== 200) {
            throw new Error(`上传图片失败，状态码: ${uploadPicRes.statusCode}`);
          }
          try {
            let uploadPicData = {};
            try {
              uploadPicData = JSON.parse(uploadPicRes.data);
            } catch (parseErr) {
              uploadPicData = { url: uploadPicRes.data };
              formatAppLog("log", "at pages/collect/collect.vue:274", "【调试】使用纯文本解析响应:", uploadPicData);
            }
            formatAppLog("log", "at pages/collect/collect.vue:277", "【调试】uploadPicData解析后:", uploadPicData);
            const imageUrl = ((_a2 = uploadPicData.data) == null ? void 0 : _a2.url) || uploadPicData.url || (uploadPicData == null ? void 0 : uploadPicData.data) || uploadPicRes.data;
            if (!imageUrl) {
              throw new Error("未获取到图片URL");
            }
            formatAppLog("log", "at pages/collect/collect.vue:290", "【调试】imageUrl:", imageUrl);
            this.ossUrl = imageUrl;
            const uploadInfoRes = await uni.request({
              url: "https://larsc.hzau.edu.cn/prod-api/plant-disease/uploadInfo",
              method: "POST",
              header: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              },
              data: {
                imageUrl,
                imageNum: this.imgId,
                longitude: this.longitude,
                latitude: this.latitude,
                branchTaskId,
                blockId: this.blockId,
                blockNum: this.blockNum,
                // 使用已初始化的blockNum
                diseaseType: this.diseaseTypes[this.diseaseIndex],
                diseaseLevel: this.diseaseLevel,
                remark: combinedRemark
                // 使用拼接后的备注
              }
            });
            formatAppLog("log", "at pages/collect/collect.vue:314", "【调试】uploadInfoRes响应:", uploadInfoRes);
            uni.hideLoading();
            if (uploadInfoRes.statusCode === 200 && uploadInfoRes.data.code === 200) {
              uni.showToast({ title: "上传成功", icon: "success" });
              const counterKey = `imageCounter_${this.blockNum}`;
              this.imageCounter++;
              uni.setStorageSync(counterKey, this.imageCounter);
              this.imgId = `${this.blockNum}_${this.imageCounter.toString().padStart(3, "0")}`;
              setTimeout(() => {
                uni.navigateBack();
              }, 1500);
            } else {
              throw new Error(uploadInfoRes.data.msg || "上传图片信息失败");
            }
          } catch (parseError) {
            formatAppLog("error", "at pages/collect/collect.vue:336", "【错误】解析图片响应失败:", parseError);
            throw new Error("解析图片响应失败");
          }
        } catch (error) {
          uni.hideLoading();
          const errorMsg = error.message || "上传失败";
          uni.showToast({
            title: `上传失败: ${errorMsg}`,
            icon: "none",
            duration: 3e3
          });
          formatAppLog("error", "at pages/collect/collect.vue:347", "【错误】上传流程异常:", error);
        }
      },
      validateForm() {
        if (!this.imageSrc) {
          uni.showToast({ title: "请先拍摄或选择图片", icon: "none" });
          return false;
        }
        if (!this.imgId) {
          uni.showToast({ title: "图片编号生成失败", icon: "none" });
          return false;
        }
        if (this.diseaseIndex === void 0 || this.diseaseIndex < 0 || this.diseaseIndex >= this.diseaseTypes.length) {
          uni.showToast({ title: "请选择有效的病害类型", icon: "none" });
          return false;
        }
        if (!this.diseaseLevel || isNaN(parseInt(this.diseaseLevel)) || parseInt(this.diseaseLevel) < 1 || parseInt(this.diseaseLevel) > 9) {
          uni.showToast({ title: "请输入有效的病害等级(1-9)", icon: "none" });
          return false;
        }
        return true;
      }
    },
    onUnload() {
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createCommentVNode(" 顶部标题栏 "),
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("text", { class: "title" }, "玉米叶片采集"),
        vue.createElementVNode("view", { class: "connection-status" }, [
          vue.createElementVNode(
            "text",
            null,
            vue.toDisplayString($data.locationStatus),
            1
            /* TEXT */
          )
        ])
      ]),
      vue.createCommentVNode(" 相机预览区域 "),
      $data.showCamera ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "camera-container"
      }, [
        vue.createElementVNode("camera", {
          class: "camera",
          "device-position": "back",
          flash: "off",
          style: { "height": "70vh" }
        }),
        vue.createCommentVNode(" 九宫格辅助线 "),
        vue.createElementVNode("view", { class: "grid-overlay" }, [
          vue.createElementVNode("view", { class: "grid-line vertical-line-1" }),
          vue.createElementVNode("view", { class: "grid-line vertical-line-2" }),
          vue.createElementVNode("view", { class: "grid-line horizontal-line-1" }),
          vue.createElementVNode("view", { class: "grid-line horizontal-line-2" })
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 照片预览区域 "),
      !$data.showCamera && $data.imageSrc ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "preview-container"
      }, [
        vue.createElementVNode("image", {
          src: $data.imageSrc,
          class: "preview-image",
          mode: "aspectFill"
        }, null, 8, ["src"]),
        $data.ossUrl ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "oss-url"
        }, [
          vue.createElementVNode(
            "text",
            null,
            "OSS URL: " + vue.toDisplayString($data.ossUrl),
            1
            /* TEXT */
          )
        ])) : vue.createCommentVNode("v-if", true),
        $data.uploadStatus ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "upload-status"
        }, [
          vue.createElementVNode(
            "text",
            null,
            vue.toDisplayString($data.uploadStatus),
            1
            /* TEXT */
          )
        ])) : vue.createCommentVNode("v-if", true)
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 操作按钮区域 "),
      vue.createElementVNode("view", { class: "button-area" }, [
        vue.createCommentVNode(" 相机模式下的按钮 "),
        $data.showCamera ? (vue.openBlock(), vue.createElementBlock(
          vue.Fragment,
          { key: 0 },
          [
            vue.createElementVNode("button", {
              class: "action-btn capture",
              onClick: _cache[0] || (_cache[0] = (...args) => $options.takePhoto && $options.takePhoto(...args))
            }, "拍照"),
            vue.createElementVNode("button", {
              class: "action-btn cancel",
              onClick: _cache[1] || (_cache[1] = (...args) => $options.cancelCamera && $options.cancelCamera(...args))
            }, "返回")
          ],
          64
          /* STABLE_FRAGMENT */
        )) : vue.createCommentVNode("v-if", true),
        vue.createCommentVNode(" 预览模式下的按钮 "),
        !$data.showCamera && $data.imageSrc ? (vue.openBlock(), vue.createElementBlock(
          vue.Fragment,
          { key: 1 },
          [
            vue.createElementVNode("view", { class: "form-container" }, [
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "label" }, "经度："),
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "input",
                    "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.longitude = $event),
                    placeholder: "请输入经度",
                    readonly: ""
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, $data.longitude]
                ])
              ]),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "label" }, "纬度："),
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "input",
                    "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $data.latitude = $event),
                    placeholder: "请输入纬度",
                    readonly: ""
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, $data.latitude]
                ])
              ]),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "label" }, "图片编号："),
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "input",
                    "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $data.imgId = $event),
                    placeholder: "自动生成",
                    readonly: ""
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, $data.imgId]
                ])
              ]),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "label" }, "样品编号："),
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "input",
                    "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $data.sampleId = $event),
                    placeholder: "请输入样品编号"
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, $data.sampleId]
                ])
              ]),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "label" }, "病害类型："),
                vue.createElementVNode("picker", {
                  class: "picker",
                  mode: "selector",
                  range: $data.diseaseTypes,
                  onChange: _cache[6] || (_cache[6] = (...args) => $options.onDiseaseChange && $options.onDiseaseChange(...args))
                }, [
                  vue.createElementVNode(
                    "view",
                    { class: "picker-text" },
                    vue.toDisplayString($data.diseaseTypes[$data.diseaseIndex] || "请选择病害类型"),
                    1
                    /* TEXT */
                  )
                ], 40, ["range"])
              ]),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "label" }, "病害等级："),
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "input",
                    "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => $data.diseaseLevel = $event),
                    placeholder: "请输入病害等级(1-9)",
                    type: "number",
                    max: "9",
                    min: "1"
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, $data.diseaseLevel]
                ])
              ]),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "label" }, "备注："),
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "input",
                    "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => $data.remark = $event),
                    placeholder: "请输入备注信息"
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, $data.remark]
                ])
              ])
            ]),
            vue.createElementVNode("button", {
              class: "action-btn confirm",
              onClick: _cache[9] || (_cache[9] = (...args) => $options.confirmImage && $options.confirmImage(...args))
            }, "确认上传"),
            vue.createElementVNode("button", {
              class: "action-btn retake",
              onClick: _cache[10] || (_cache[10] = (...args) => $options.retakePhoto && $options.retakePhoto(...args))
            }, "重新拍摄")
          ],
          64
          /* STABLE_FRAGMENT */
        )) : vue.createCommentVNode("v-if", true),
        vue.createCommentVNode(" 初始状态下的按钮 "),
        !$data.showCamera && !$data.imageSrc ? (vue.openBlock(), vue.createElementBlock(
          vue.Fragment,
          { key: 2 },
          [
            vue.createElementVNode("button", {
              class: "action-btn capture",
              onClick: _cache[11] || (_cache[11] = (...args) => $options.startCamera && $options.startCamera(...args))
            }, "调用相机拍摄"),
            vue.createElementVNode("button", {
              class: "action-btn album",
              onClick: _cache[12] || (_cache[12] = (...args) => $options.chooseFromAlbum && $options.chooseFromAlbum(...args))
            }, "从图库上传")
          ],
          64
          /* STABLE_FRAGMENT */
        )) : vue.createCommentVNode("v-if", true)
      ])
    ]);
  }
  const PagesCollectCollect = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$4], ["__scopeId", "data-v-b24c290b"], ["__file", "D:/WeChat Files/wxid_7gwua196xhea12/FileStorage/File/2025-07/狮山云瞳 2/pages/collect/collect.vue"]]);
  const _sfc_main$3 = {
    data() {
      return {
        taskId: "",
        taskName: "",
        plotId: "",
        blockNum: "",
        imgId: "",
        imageUrl: "",
        longitude: "",
        latitude: "",
        sampleId: "",
        // 新增样品编号字段
        remark: "",
        // 单独备注字段
        diseaseType: "",
        diseaseLevel: "",
        status: "",
        // 编辑状态相关
        isEditing: false,
        editLongitude: "",
        editLatitude: "",
        editSampleId: "",
        // 编辑状态的样品编号
        editRemark: "",
        // 编辑状态的备注
        editDiseaseLevel: "",
        diseaseTypes: ["黄叶病", "锈斑病", "其他"],
        diseaseIndex: 0,
        // 接口数据
        imageDetail: null,
        // 全局数据引用
        globalData: getApp().globalData,
        // 弹窗控制
        showModifyModal: false,
        // 大图预览控制
        showPreview: false,
        // 修改请求状态
        isSubmitting: false,
        // 原始备注信息，用于取消编辑时恢复
        originalNote: ""
      };
    },
    computed: {
      // 格式化图片URL，将localhost替换为10.100.5.57
      formattedImageUrl() {
        if (!this.imageUrl)
          return "";
        return this.imageUrl.replace("localhost", "larsc.hzau.edu.cn");
      }
    },
    onLoad(options) {
      this.taskId = options.taskId || "";
      this.taskName = options.taskName || "";
      this.plotId = options.plotId || "";
      this.imgId = options.imgId || "";
      this.branchTaskId = options.branchTaskId || "";
      this.blockId = options.blockId || "";
      this.imageNum = options.imageNum || "";
      this.fetchImageDetail();
    },
    methods: {
      // 调用接口获取图片详细信息
      async fetchImageDetail() {
        var _a2, _b;
        if (!this.branchTaskId || !this.blockId || !this.imageNum) {
          uni.showToast({
            title: "参数不完整，无法获取图片信息",
            icon: "none"
          });
          return;
        }
        try {
          uni.showLoading({ title: "加载中..." });
          const token = uni.getStorageSync("token");
          if (!token) {
            throw new Error("用户未登录");
          }
          const response = await uni.request({
            url: `${this.globalData.baseUrl || "https://larsc.hzau.edu.cn/prod-api"}/plant-disease/singlePictureInfo`,
            method: "GET",
            header: {
              "Authorization": token,
              "Accept": "*/*"
            },
            data: {
              branchTaskId: this.branchTaskId,
              blockId: this.blockId,
              imageNum: this.imageNum
            }
          });
          let res = Array.isArray(response) ? response[0] : response;
          if (res.statusCode === 200 && ((_a2 = res.data) == null ? void 0 : _a2.code) === 200) {
            const data = res.data.data;
            this.imageDetail = data;
            this.imageUrl = data.imageUrl;
            this.longitude = data.longitude;
            this.latitude = data.latitude;
            this.originalNote = data.remark || "";
            if (this.originalNote) {
              const parts = this.originalNote.split("#");
              this.sampleId = parts[0] || "";
              this.remark = parts[1] || "";
            }
            this.diseaseType = data.diseaseType;
            this.diseaseLevel = data.diseaseLevel;
            this.status = data.status || "uploaded";
            this.blockNum = data.blockNum;
            this.imgId = data.imageNum || this.imgId;
            this.editLongitude = this.longitude;
            this.editLatitude = this.latitude;
            this.editSampleId = this.sampleId;
            this.editRemark = this.remark;
            this.editDiseaseLevel = this.diseaseLevel;
            this.diseaseIndex = this.diseaseTypes.indexOf(this.diseaseType) >= 0 ? this.diseaseTypes.indexOf(this.diseaseType) : 0;
          } else {
            throw new Error(((_b = res.data) == null ? void 0 : _b.msg) || "获取图片信息失败");
          }
        } catch (error) {
          formatAppLog("error", "at pages/result/result.vue:286", "获取图片详情失败:", error);
          uni.showToast({
            title: error.message || "获取图片信息失败",
            icon: "none"
          });
        } finally {
          uni.hideLoading();
        }
      },
      // 开始编辑
      startEditing() {
        this.isEditing = true;
      },
      // 确认编辑
      confirmEditing() {
        this.showModifyModal = true;
      },
      // 取消修改
      cancelModify() {
        this.showModifyModal = false;
      },
      // 保存修改 - 对接编辑接口
      async saveModify() {
        var _a2, _b, _c;
        if (this.isSubmitting)
          return;
        if (this.editDiseaseLevel && (this.editDiseaseLevel < 1 || this.editDiseaseLevel > 9)) {
          uni.showToast({
            title: "病害等级必须在1-9之间",
            icon: "none"
          });
          return;
        }
        try {
          this.isSubmitting = true;
          this.showModifyModal = false;
          const token = uni.getStorageSync("token");
          if (!token) {
            throw new Error("用户未登录");
          }
          const combinedNote = `${this.editSampleId || ""}#${this.editRemark || ""}`;
          const requestData = {
            id: (_a2 = this.imageDetail) == null ? void 0 : _a2.id,
            longitude: this.editLongitude,
            latitude: this.editLatitude,
            remark: combinedNote,
            // 使用拼接后的备注
            diseaseType: this.diseaseTypes[this.diseaseIndex],
            diseaseLevel: this.editDiseaseLevel,
            imageUrl: this.imageUrl,
            branchTaskId: this.branchTaskId,
            blockId: this.blockId,
            blockNum: this.blockNum
          };
          const response = await uni.request({
            url: `${this.globalData.baseUrl || "https://larsc.hzau.edu.cn/prod-api"}/plant-disease/editInfo`,
            method: "POST",
            header: {
              "Authorization": token,
              "Content-Type": "application/json",
              "Accept": "*/*"
            },
            data: requestData
          });
          let res = Array.isArray(response) ? response[0] : response;
          if (res.statusCode === 200 && ((_b = res.data) == null ? void 0 : _b.code) === 200) {
            this.longitude = this.editLongitude;
            this.latitude = this.editLatitude;
            this.sampleId = this.editSampleId;
            this.remark = this.editRemark;
            this.diseaseLevel = this.editDiseaseLevel;
            this.diseaseType = this.diseaseTypes[this.diseaseIndex];
            this.originalNote = combinedNote;
            this.isEditing = false;
            uni.showToast({
              title: "修改成功",
              icon: "success"
            });
            uni.$emit("imageInfoUpdated", {
              imgId: this.imgId,
              updatedData: {
                longitude: this.longitude,
                latitude: this.latitude,
                remark: combinedNote,
                diseaseType: this.diseaseType,
                diseaseLevel: this.diseaseLevel
              }
            });
            setTimeout(() => {
              uni.navigateBack();
            }, 500);
          } else {
            throw new Error(((_c = res.data) == null ? void 0 : _c.msg) || "修改失败");
          }
        } catch (error) {
          formatAppLog("error", "at pages/result/result.vue:401", "修改图片信息失败:", error);
          uni.showToast({
            title: error.message || "修改失败",
            icon: "none"
          });
        } finally {
          this.isSubmitting = false;
        }
      },
      // 病害类型变更
      onDiseaseChange(e) {
        this.diseaseIndex = e.detail.value;
      },
      // 验证病害等级输入
      validateDiseaseLevel(e) {
        let value = e.detail.value;
        if (value) {
          value = parseInt(value);
          if (isNaN(value) || value < 1) {
            value = 1;
          } else if (value > 9) {
            value = 9;
          }
          this.editDiseaseLevel = value.toString();
        }
      },
      getStatusText(status) {
        const map = {
          uploaded: "已上传",
          notUploaded: "未上传"
        };
        return map[status] || status;
      },
      // 显示大图预览
      showImagePreview() {
        if (this.imageUrl) {
          this.showPreview = true;
        }
      },
      // 关闭大图预览
      closePreview() {
        this.showPreview = false;
      },
      // 处理返回操作
      handleBack() {
        if (this.isEditing) {
          uni.showModal({
            title: "提示",
            content: "您有未保存的修改，确定要返回吗？",
            success: (res) => {
              if (res.confirm) {
                this.editSampleId = this.sampleId;
                this.editRemark = this.remark;
                this.isEditing = false;
                uni.navigateBack();
              }
            }
          });
        } else {
          uni.navigateBack();
        }
      }
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createCommentVNode(" 表型采集结果 "),
      vue.createElementVNode("view", { class: "result-content" }, [
        vue.createElementVNode("view", { class: "image-single" }, [
          vue.createCommentVNode(" 添加点击事件显示大图 "),
          $data.imageUrl ? (vue.openBlock(), vue.createElementBlock("image", {
            key: 0,
            class: "result-image",
            src: $options.formattedImageUrl,
            mode: "aspectFill",
            onClick: _cache[0] || (_cache[0] = (...args) => $options.showImagePreview && $options.showImagePreview(...args))
          }, null, 8, ["src"])) : (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "loading-tip"
          }, [
            vue.createElementVNode("text", null, "加载图片中...")
          ]))
        ]),
        vue.createElementVNode("view", { class: "info-group" }, [
          vue.createElementVNode("view", { class: "info-item" }, [
            vue.createElementVNode("text", { class: "info-label" }, "任务ID："),
            vue.createElementVNode(
              "text",
              { class: "info-value" },
              vue.toDisplayString($data.taskId),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "info-item" }, [
            vue.createElementVNode("text", { class: "info-label" }, "任务名称："),
            vue.createElementVNode(
              "text",
              { class: "info-value" },
              vue.toDisplayString($data.taskName),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "info-item" }, [
            vue.createElementVNode("text", { class: "info-label" }, "小区ID："),
            vue.createElementVNode(
              "text",
              { class: "info-value" },
              vue.toDisplayString($data.plotId),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "info-item" }, [
            vue.createElementVNode("text", { class: "info-label" }, "小区名称："),
            vue.createElementVNode(
              "text",
              { class: "info-value" },
              vue.toDisplayString($data.blockNum),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "info-item" }, [
            vue.createElementVNode("text", { class: "info-label" }, "图片编号："),
            vue.createCommentVNode(" 移除可编辑状态，始终显示图片编号 "),
            vue.createElementVNode(
              "view",
              { class: "info-value" },
              vue.toDisplayString($data.imgId),
              1
              /* TEXT */
            )
          ]),
          vue.createCommentVNode(" 样品编号 - 可编辑/只读状态切换 "),
          !$data.isEditing ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "info-item"
          }, [
            vue.createElementVNode("text", { class: "info-label" }, "样品编号："),
            vue.createElementVNode(
              "text",
              { class: "info-value" },
              vue.toDisplayString($data.sampleId),
              1
              /* TEXT */
            )
          ])) : (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "info-item"
          }, [
            vue.createElementVNode("text", { class: "info-label" }, "样品编号："),
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                class: "edit-input",
                "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.editSampleId = $event),
                placeholder: "请输入样品编号"
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vModelText, $data.editSampleId]
            ])
          ])),
          vue.createCommentVNode(" 经度 - 可编辑/只读状态切换 "),
          !$data.isEditing ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 2,
            class: "info-item"
          }, [
            vue.createElementVNode("text", { class: "info-label" }, "经度："),
            vue.createElementVNode(
              "text",
              { class: "info-value" },
              vue.toDisplayString($data.longitude),
              1
              /* TEXT */
            )
          ])) : (vue.openBlock(), vue.createElementBlock("view", {
            key: 3,
            class: "info-item"
          }, [
            vue.createElementVNode("text", { class: "info-label" }, "经度："),
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                class: "edit-input",
                "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.editLongitude = $event),
                placeholder: "请输入经度"
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vModelText, $data.editLongitude]
            ])
          ])),
          vue.createCommentVNode(" 纬度 - 可编辑/只读状态切换 "),
          !$data.isEditing ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 4,
            class: "info-item"
          }, [
            vue.createElementVNode("text", { class: "info-label" }, "纬度："),
            vue.createElementVNode(
              "text",
              { class: "info-value" },
              vue.toDisplayString($data.latitude),
              1
              /* TEXT */
            )
          ])) : (vue.openBlock(), vue.createElementBlock("view", {
            key: 5,
            class: "info-item"
          }, [
            vue.createElementVNode("text", { class: "info-label" }, "纬度："),
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                class: "edit-input",
                "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $data.editLatitude = $event),
                placeholder: "请输入纬度"
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vModelText, $data.editLatitude]
            ])
          ])),
          vue.createCommentVNode(" 备注 - 可编辑/只读状态切换 "),
          !$data.isEditing ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 6,
            class: "info-item"
          }, [
            vue.createElementVNode("text", { class: "info-label" }, "备注："),
            vue.createElementVNode(
              "text",
              { class: "info-value" },
              vue.toDisplayString($data.remark),
              1
              /* TEXT */
            )
          ])) : (vue.openBlock(), vue.createElementBlock("view", {
            key: 7,
            class: "info-item"
          }, [
            vue.createElementVNode("text", { class: "info-label" }, "备注："),
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                class: "edit-input",
                "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $data.editRemark = $event),
                placeholder: "请输入备注信息"
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vModelText, $data.editRemark]
            ])
          ])),
          vue.createCommentVNode(" 病害类型 - 可编辑/只读状态切换 "),
          !$data.isEditing ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 8,
            class: "info-item"
          }, [
            vue.createElementVNode("text", { class: "info-label" }, "病害类型："),
            vue.createElementVNode(
              "text",
              { class: "info-value" },
              vue.toDisplayString($data.diseaseType),
              1
              /* TEXT */
            )
          ])) : (vue.openBlock(), vue.createElementBlock("view", {
            key: 9,
            class: "info-item"
          }, [
            vue.createElementVNode("text", { class: "info-label" }, "病害类型："),
            vue.createElementVNode("picker", {
              class: "picker",
              mode: "selector",
              range: $data.diseaseTypes,
              onChange: _cache[5] || (_cache[5] = (...args) => $options.onDiseaseChange && $options.onDiseaseChange(...args)),
              value: $data.diseaseIndex
            }, [
              vue.createElementVNode(
                "view",
                { class: "picker-text" },
                vue.toDisplayString($data.diseaseTypes[$data.diseaseIndex] || "请选择病害类型"),
                1
                /* TEXT */
              )
            ], 40, ["range", "value"])
          ])),
          vue.createCommentVNode(" 病害等级 - 可编辑/只读状态切换 "),
          !$data.isEditing ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 10,
            class: "info-item"
          }, [
            vue.createElementVNode("text", { class: "info-label" }, "病害等级："),
            vue.createElementVNode(
              "text",
              { class: "info-value" },
              vue.toDisplayString($data.diseaseLevel),
              1
              /* TEXT */
            )
          ])) : (vue.openBlock(), vue.createElementBlock("view", {
            key: 11,
            class: "info-item"
          }, [
            vue.createElementVNode("text", { class: "info-label" }, "病害等级："),
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                class: "edit-input",
                "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $data.editDiseaseLevel = $event),
                placeholder: "请输入病害等级(1-9)",
                type: "digit",
                onInput: _cache[7] || (_cache[7] = (...args) => $options.validateDiseaseLevel && $options.validateDiseaseLevel(...args))
              },
              null,
              544
              /* NEED_HYDRATION, NEED_PATCH */
            ), [
              [vue.vModelText, $data.editDiseaseLevel]
            ])
          ])),
          vue.createElementVNode("view", { class: "info-item" }, [
            vue.createElementVNode("text", { class: "info-label" }, "上传状态："),
            vue.createElementVNode(
              "text",
              { class: "info-value" },
              vue.toDisplayString($options.getStatusText($data.status)),
              1
              /* TEXT */
            )
          ])
        ])
      ]),
      vue.createCommentVNode(" 按钮区域 "),
      vue.createElementVNode("view", { class: "button-area" }, [
        !$data.isEditing ? (vue.openBlock(), vue.createElementBlock("button", {
          key: 0,
          class: "action-btn modify",
          onClick: _cache[8] || (_cache[8] = (...args) => $options.startEditing && $options.startEditing(...args))
        }, "修改")) : (vue.openBlock(), vue.createElementBlock("button", {
          key: 1,
          class: "action-btn confirm-modify",
          onClick: _cache[9] || (_cache[9] = (...args) => $options.confirmEditing && $options.confirmEditing(...args))
        }, "确认修改")),
        vue.createElementVNode("button", {
          class: "action-btn back",
          onClick: _cache[10] || (_cache[10] = (...args) => $options.handleBack && $options.handleBack(...args))
        }, "返回")
      ]),
      vue.createCommentVNode(" 修改确认弹窗 "),
      $data.showModifyModal ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "modal"
      }, [
        vue.createElementVNode("view", { class: "modal-content" }, [
          vue.createElementVNode("view", { class: "modal-header" }, [
            vue.createElementVNode("text", { class: "modal-title" }, "确认修改")
          ]),
          vue.createElementVNode("view", { class: "modal-body" }, [
            vue.createElementVNode(
              "text",
              null,
              "是否对编号为 " + vue.toDisplayString($data.imgId) + " 的图片进行信息修改？",
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "modal-footer" }, [
            vue.createElementVNode("button", {
              class: "modal-btn cancel",
              onClick: _cache[11] || (_cache[11] = (...args) => $options.cancelModify && $options.cancelModify(...args))
            }, "返回"),
            vue.createElementVNode("button", {
              class: "modal-btn confirm",
              onClick: _cache[12] || (_cache[12] = (...args) => $options.saveModify && $options.saveModify(...args))
            }, "确认")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 大图预览弹窗 "),
      $data.showPreview ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "image-preview"
      }, [
        vue.createElementVNode("view", {
          class: "preview-mask",
          onClick: _cache[13] || (_cache[13] = (...args) => $options.closePreview && $options.closePreview(...args))
        }),
        vue.createElementVNode("view", { class: "preview-content" }, [
          vue.createElementVNode("image", {
            class: "preview-image",
            src: $options.formattedImageUrl,
            mode: "aspectFit"
          }, null, 8, ["src"]),
          vue.createElementVNode("view", {
            class: "close-btn",
            onClick: _cache[14] || (_cache[14] = (...args) => $options.closePreview && $options.closePreview(...args))
          }, "×")
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesResultResult = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$3], ["__scopeId", "data-v-b615976f"], ["__file", "D:/WeChat Files/wxid_7gwua196xhea12/FileStorage/File/2025-07/狮山云瞳 2/pages/result/result.vue"]]);
  function requestStoragePermission() {
    return new Promise((resolve, reject) => {
      if (plus.os.name.toLowerCase() !== "android") {
        resolve(true);
        return;
      }
      const main = plus.android.runtimeMainActivity();
      const permission = "android.permission.WRITE_EXTERNAL_STORAGE";
      const checkPermission = plus.android.importClass("android.content.pm.PackageManager");
      const pkgManager = main.getPackageManager();
      const hasPermission = pkgManager.checkPermission(permission, main.getPackageName());
      if (hasPermission === checkPermission.PERMISSION_GRANTED) {
        resolve(true);
      } else {
        const Permissions = plus.android.importClass("android.support.v4.app.ActivityCompat");
        Permissions.requestPermissions(main, [permission], 0);
        setTimeout(() => {
          resolve(true);
        }, 1e3);
      }
    });
  }
  const _sfc_main$2 = {
    data() {
      return {
        isOnline: true,
        imageSrc: "",
        longitude: "",
        latitude: "",
        diseaseTypes: ["黄叶病", "锈斑病", "其他"],
        diseaseIndex: 0,
        diseaseLevel: "",
        remark: "",
        taskName: "",
        plotName: ""
      };
    },
    onShow() {
      this.checkNetwork();
      this.getLocation();
    },
    onLoad() {
      this.requestAndroidPermissions();
    },
    methods: {
      requestAndroidPermissions() {
        if (typeof plus !== "undefined" && plus.os.name === "Android") {
          const permissions = [
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.WRITE_EXTERNAL_STORAGE"
          ];
          plus.android.requestPermissions(permissions, (resultObj) => {
            const granted = resultObj.granted;
            resultObj.deniedPresent;
            resultObj.deniedAlways;
            formatAppLog("log", "at pages/offline/offline.vue:124", "权限申请结果：", resultObj);
            if (granted.length === permissions.length) {
              formatAppLog("log", "at pages/offline/offline.vue:127", "所有权限已授予");
            } else {
              uni.showModal({
                title: "权限提醒",
                content: "为了正常使用，请授予存储权限",
                showCancel: false
              });
            }
          }, (error) => {
            formatAppLog("error", "at pages/offline/offline.vue:136", "权限申请失败：", error);
          });
        }
      },
      checkNetwork() {
        uni.getNetworkType({
          success: (res) => {
            this.isOnline = res.networkType !== "none";
          }
        });
      },
      getLocation() {
        uni.getLocation({
          type: "wgs84",
          success: (res) => {
            this.longitude = res.longitude.toFixed(6);
            this.latitude = res.latitude.toFixed(6);
          },
          fail: () => {
            this.longitude = "";
            this.latitude = "";
          }
        });
      },
      takePhoto() {
        uni.chooseImage({
          count: 1,
          sourceType: ["camera"],
          success: (res) => {
            this.imageSrc = res.tempFilePaths[0];
            this.getLocation();
          },
          fail: () => {
            uni.showToast({ title: "拍照失败", icon: "none" });
          }
        });
      },
      chooseFromAlbum() {
        uni.chooseImage({
          count: 1,
          success: (res) => {
            this.imageSrc = res.tempFilePaths[0];
            this.getLocation();
          }
        });
      },
      onDiseaseChange(e) {
        this.diseaseIndex = e.detail.value;
      },
      // saveOfflineData() {
      //   if (!this.taskName || !this.plotName || !this.imageSrc || !this.diseaseLevel) {
      // 	uni.showToast({ title: '请填写完整信息', icon: 'none' });
      // 	return;
      //   }
      //   // 先定义一个统一保存record的函数
      //   const saveRecordToStorage = (record) => {
      // 	const key = `taskData_${this.taskName}_${this.plotName}`;
      // 	const stored = uni.getStorageSync(key) || [];
      // 	stored.push(record);
      // 	uni.setStorageSync(key, stored);
      // 	uni.showToast({ title: '已保存到本地缓存', icon: 'success' });
      // 	this.resetForm();
      //   };
      // // App端写文件的函数
      // const saveRecordToFile = (record) => {
      //   const taskDir = `_doc/offline/${this.taskName}`;
      //   const plotDir = `${taskDir}/${this.plotName}`;
      //   const fileName = `${record.id}.json`;
      //   const imageName = `img_${record.id}.jpg`;
      //   const plusPath = plus.io.convertLocalFileSystemURL(this.imageSrc); // ✅ 转换路径
      //   plus.io.resolveLocalFileSystemURL(plusPath, (entry) => {
      //     plus.io.requestFileSystem(plus.io.PRIVATE_DOC, (fs) => {
      //       fs.root.getDirectory(taskDir, { create: true }, (taskEntry) => {
      //         taskEntry.getDirectory(this.plotName, { create: true }, (plotEntry) => {
      //           plotEntry.getFile(imageName, { create: true }, (fileEntry) => {
      //             entry.copyTo(plotEntry, imageName, (copiedImageEntry) => {
      //               record.image = copiedImageEntry.fullPath.startsWith('file://')
      //                 ? copiedImageEntry.fullPath
      //                 : 'file://' + copiedImageEntry.fullPath;
      //               record.imageType = 'path';
      //               plotEntry.getFile(fileName, { create: true }, (jsonEntry) => {
      //                 jsonEntry.createWriter((writer) => {
      //                   writer.write(JSON.stringify(record, null, 2));
      //                   uni.showToast({ title: '已保存到本地文件', icon: 'success' });
      //                   this.resetForm();
      //                 }, (e) => {
      //                   __f__('error','at pages/offline/offline.vue:229','写 JSON 文件失败', e);
      //                   uni.showToast({ title: '记录写入失败', icon: 'none' });
      //                 });
      //               }, (e) => {
      //                 __f__('error','at pages/offline/offline.vue:233','创建 JSON 文件失败', e);
      //                 uni.showToast({ title: 'JSON 文件创建失败', icon: 'none' });
      //               });
      //             }, (e) => {
      //               __f__('error','at pages/offline/offline.vue:238','图片复制失败', e);
      //               uni.showToast({ title: '图片保存失败', icon: 'none' });
      //             });
      //           });
      //         }, (e) => {
      //           __f__('error','at pages/offline/offline.vue:243','创建 plot 文件夹失败', e);
      //           uni.showToast({ title: '小区目录创建失败', icon: 'none' });
      //         });
      //       }, (e) => {
      //         __f__('error','at pages/offline/offline.vue:247','创建 task 文件夹失败', e);
      //         uni.showToast({ title: '任务目录创建失败', icon: 'none' });
      //       });
      //     }, (e) => {
      //       __f__('error','at pages/offline/offline.vue:251','获取文件系统失败', e);
      //       uni.showToast({ title: '文件系统错误', icon: 'none' });
      //     });
      //   }, (e) => {
      //     __f__('error','at pages/offline/offline.vue:255','读取图片路径失败', e);
      //     uni.showToast({ title: '图片读取失败', icon: 'none' });
      //   });
      // };
      //   // H5端把图片转Base64
      //   const handleH5Save = () => {
      // 	fetch(this.imageSrc)
      // 	  .then(res => res.blob())
      // 	  .then(blob => {
      // 		const reader = new FileReader();
      // 		reader.onloadend = () => {
      // 		  const base64Image = reader.result;
      // 		  const record = {
      // 			id: Date.now(),
      // 			image: base64Image,
      // 			// imageType: 'base64',
      // 			image: this.imageSrc,
      // 			longitude: this.longitude,
      // 			latitude: this.latitude,
      // 			diseaseType: this.diseaseTypes[this.diseaseIndex],
      // 			diseaseLevel: this.diseaseLevel,
      // 			remark: this.remark,
      // 			timestamp: new Date().toISOString()
      // 		  };
      // 		  saveRecordToStorage(record);
      // 		};
      // 		reader.readAsDataURL(blob);
      // 	  })
      // 	  .catch(() => {
      // 		uni.showToast({ title: '图片处理失败', icon: 'none' });
      // 	  });
      //   };
      //   // 判断平台
      //   const isApp = typeof plus !== 'undefined';
      //   if (isApp) {
      // 	// App端直接用图片路径
      // 	const record = {
      // 	  id: Date.now(),
      // 	  image: this.imageSrc,
      // 	  imageType: 'path',
      // 	  longitude: this.longitude,
      // 	  latitude: this.latitude,
      // 	  diseaseType: this.diseaseTypes[this.diseaseIndex],
      // 	  diseaseLevel: this.diseaseLevel,
      // 	  remark: this.remark,
      // 	  timestamp: new Date().toISOString()
      // 	};
      // 	saveRecordToFile(record);
      //   } else {
      // 	// H5端转base64存缓存
      // 	handleH5Save();
      //   }
      // },
      async saveOfflineData() {
        if (!this.taskName || !this.plotName || !this.imageSrc || !this.diseaseLevel) {
          uni.showToast({ title: "请填写完整信息", icon: "none" });
          return;
        }
        const isApp = typeof plus !== "undefined";
        const record = {
          id: Date.now(),
          taskName: this.taskName,
          plotName: this.plotName,
          image: this.imageSrc,
          longitude: this.longitude,
          latitude: this.latitude,
          diseaseType: this.diseaseTypes[this.diseaseIndex],
          diseaseLevel: this.diseaseLevel,
          remark: this.remark,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
        if (isApp) {
          if (plus.os.name === "Android") {
            const granted = await requestStoragePermission();
            if (!granted) {
              uni.showToast({ title: "请授予存储权限", icon: "none" });
              return;
            }
          }
          const taskDir = `_doc/offline/${record.taskName}`;
          `${taskDir}/${record.plotName}`;
          const timestamp = record.id;
          const filename = `${timestamp}.json`;
          const plusPath = plus.io.convertLocalFileSystemURL(record.image);
          plus.io.resolveLocalFileSystemURL(plusPath, (fileEntry) => {
            plus.io.requestFileSystem(plus.io.PRIVATE_DOC, (fs) => {
              fs.root.getDirectory("offline", { create: true }, (offlineDir) => {
                offlineDir.getDirectory(record.taskName, { create: true }, (taskEntry) => {
                  taskEntry.getDirectory(record.plotName, { create: true }, (plotEntry) => {
                    const ext = record.image.substring(record.image.lastIndexOf("."));
                    const imageName = `${timestamp}${ext}`;
                    fileEntry.copyTo(plotEntry, imageName, (copiedImageEntry) => {
                      record.image = copiedImageEntry.fullPath.startsWith("file://") ? copiedImageEntry.fullPath : "file://" + copiedImageEntry.fullPath;
                      plotEntry.getFile(filename, { create: true }, (jsonFileEntry) => {
                        jsonFileEntry.createWriter((writer) => {
                          writer.write(JSON.stringify(record, null, 2));
                          uni.showToast({ title: "保存成功", icon: "success" });
                          this.resetForm();
                        }, (err) => {
                          formatAppLog("error", "at pages/offline/offline.vue:378", "写入JSON文件失败:", err);
                          uni.showToast({ title: "保存失败", icon: "none" });
                        });
                      }, (err) => {
                        formatAppLog("error", "at pages/offline/offline.vue:382", "创建JSON文件失败:", err);
                        uni.showToast({ title: "保存失败", icon: "none" });
                      });
                    }, (err) => {
                      formatAppLog("error", "at pages/offline/offline.vue:386", "复制图片失败:", err);
                      uni.showToast({ title: "保存失败", icon: "none" });
                    });
                  }, (err) => {
                    formatAppLog("error", "at pages/offline/offline.vue:391", "创建小区文件夹失败:", err);
                    uni.showToast({ title: "保存失败", icon: "none" });
                  });
                }, (err) => {
                  formatAppLog("error", "at pages/offline/offline.vue:395", "创建任务文件夹失败:", err);
                  uni.showToast({ title: "保存失败", icon: "none" });
                });
              }, (err) => {
                formatAppLog("error", "at pages/offline/offline.vue:399", "创建offline文件夹失败:", err);
                uni.showToast({ title: "保存失败", icon: "none" });
              });
            }, (err) => {
              formatAppLog("error", "at pages/offline/offline.vue:403", "请求文件系统失败:", err);
              uni.showToast({ title: "保存失败", icon: "none" });
            });
          }, (err) => {
            formatAppLog("error", "at pages/offline/offline.vue:407", "读取图片路径失败:", err);
            uni.showToast({ title: "保存失败", icon: "none" });
          });
        } else {
          try {
            const res = await fetch(record.image);
            const blob = await res.blob();
            const base64 = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            record.image = base64;
            const storageKey = `taskData_${record.taskName}_${record.plotName}`;
            const existing = uni.getStorageSync(storageKey) || [];
            existing.push(record);
            uni.setStorageSync(storageKey, existing);
            uni.showToast({ title: "本地保存成功", icon: "success" });
            this.resetForm();
          } catch (error) {
            formatAppLog("error", "at pages/offline/offline.vue:434", "H5图片转换失败:", error);
            uni.showToast({ title: "图片处理失败", icon: "none" });
          }
        }
      },
      resetForm() {
        this.imageSrc = "";
        this.taskName = "";
        this.plotName = "";
        this.longitude = "";
        this.latitude = "";
        this.diseaseIndex = 0;
        this.diseaseLevel = "";
        this.remark = "";
      },
      goBack() {
        uni.reLaunch({
          url: "/pages/login/login"
        });
      },
      goToRecordView() {
        uni.navigateTo({
          url: "/pages/record/record"
        });
      },
      resetForm() {
        this.imageSrc = "";
        this.diseaseLevel = "";
        this.remark = "";
        this.taskName = "";
        this.plotName = "";
      }
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("text", { class: "title" }, "离线采集"),
        vue.createElementVNode(
          "text",
          { class: "status" },
          vue.toDisplayString($data.isOnline ? "已联网" : "离线模式"),
          1
          /* TEXT */
        )
      ]),
      vue.createCommentVNode(" 图片预览 "),
      $data.imageSrc ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "preview-area"
      }, [
        vue.createElementVNode("image", {
          src: $data.imageSrc,
          class: "preview-img",
          mode: "aspectFill"
        }, null, 8, ["src"])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 表单区域 "),
      vue.createElementVNode("view", { class: "form-container" }, [
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "label" }, "任务名："),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              class: "input",
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.taskName = $event),
              placeholder: "请输入任务名"
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $data.taskName]
          ])
        ]),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "label" }, "小区名："),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              class: "input",
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.plotName = $event),
              placeholder: "请输入小区名"
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $data.plotName]
          ])
        ]),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "label" }, "经度："),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              class: "input",
              "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.longitude = $event),
              placeholder: "自动获取",
              readonly: ""
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $data.longitude]
          ])
        ]),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "label" }, "纬度："),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              class: "input",
              "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $data.latitude = $event),
              placeholder: "自动获取",
              readonly: ""
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $data.latitude]
          ])
        ]),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "label" }, "病害类型："),
          vue.createElementVNode("picker", {
            range: $data.diseaseTypes,
            onChange: _cache[4] || (_cache[4] = (...args) => $options.onDiseaseChange && $options.onDiseaseChange(...args))
          }, [
            vue.createElementVNode(
              "view",
              { class: "picker-text" },
              vue.toDisplayString($data.diseaseTypes[$data.diseaseIndex] || "请选择病害类型"),
              1
              /* TEXT */
            )
          ], 40, ["range"])
        ]),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "label" }, "等级："),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              class: "input",
              type: "number",
              "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $data.diseaseLevel = $event),
              placeholder: "1-9"
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $data.diseaseLevel]
          ])
        ]),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "label" }, "备注："),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              class: "input",
              "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $data.remark = $event),
              placeholder: "请输入备注"
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $data.remark]
          ])
        ])
      ]),
      vue.createCommentVNode(" 操作按钮 "),
      vue.createElementVNode("view", { class: "button-area" }, [
        vue.createElementVNode("button", {
          onClick: _cache[7] || (_cache[7] = (...args) => $options.takePhoto && $options.takePhoto(...args)),
          class: "btn camera"
        }, "拍照"),
        vue.createElementVNode("button", {
          onClick: _cache[8] || (_cache[8] = (...args) => $options.chooseFromAlbum && $options.chooseFromAlbum(...args)),
          class: "btn album"
        }, "选择图片"),
        vue.createElementVNode("button", {
          onClick: _cache[9] || (_cache[9] = (...args) => $options.saveOfflineData && $options.saveOfflineData(...args)),
          class: "btn save"
        }, "保存本地"),
        vue.createElementVNode("button", {
          onClick: _cache[10] || (_cache[10] = (...args) => $options.goBack && $options.goBack(...args)),
          class: "btn goback"
        }, "返回登录"),
        vue.createElementVNode("button", {
          onClick: _cache[11] || (_cache[11] = (...args) => $options.goToRecordView && $options.goToRecordView(...args)),
          class: "btn record"
        }, "查看记录")
      ])
    ]);
  }
  const PagesOfflineOffline = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$2], ["__scopeId", "data-v-6f90cad7"], ["__file", "D:/WeChat Files/wxid_7gwua196xhea12/FileStorage/File/2025-07/狮山云瞳 2/pages/offline/offline.vue"]]);
  const _sfc_main$1 = {
    data() {
      return {
        records: []
        // 所有离线记录
      };
    },
    onShow() {
      this.loadRecords();
    },
    methods: {
      async loadRecords() {
        if (typeof plus === "undefined") {
          uni.showToast({ title: "非App环境暂不支持查看离线记录", icon: "none" });
          return;
        }
        this.records = [];
        try {
          await this.requestStoragePermission();
          const offlineDir = await this.getOrCreateDir("_doc/offline");
          const taskDirs = await this.readDirEntries(offlineDir);
          for (const taskDir of taskDirs) {
            const taskEntry = await this.getDirEntry(offlineDir, taskDir);
            const plotDirs = await this.readDirEntries(taskEntry);
            const plotList = [];
            for (const plotDir of plotDirs) {
              const plotEntry = await this.getDirEntry(taskEntry, plotDir);
              const files = await this.readDirEntries(plotEntry);
              const items = [];
              for (const fileName of files) {
                if (fileName.endsWith(".json")) {
                  const jsonEntry = await this.getFileEntry(plotEntry, fileName);
                  const content = await this.readFileContent(jsonEntry);
                  try {
                    const record = JSON.parse(content);
                    items.push(record);
                  } catch (e) {
                    formatAppLog("warn", "at pages/record/record.vue:77", "解析 JSON 失败:", e);
                  }
                }
              }
              plotList.push({
                plotName: plotDir,
                items
              });
            }
            this.records.push({
              taskName: taskDir,
              plots: plotList
            });
          }
        } catch (error) {
          formatAppLog("error", "at pages/record/record.vue:94", error);
          uni.showToast({ title: "加载记录失败", icon: "none" });
        }
      },
      // async deleteRecord(taskName, plotName, imagePath, timestamp) {
      //   if (typeof plus === "undefined") {
      //     uni.showToast({ title: '非App环境不支持删除', icon: 'none' });
      //     return;
      //   }
      //   try {
      //     // 删除图片
      //     let localImagePath = imagePath;
      //     if (!localImagePath.startsWith('file://')) {
      //       localImagePath = 'file://' + localImagePath;
      //     }
      //     await new Promise((resolve, reject) => {
      //       plus.io.resolveLocalFileSystemURL(localImagePath,
      //         entry => entry.remove(resolve, reject),
      //         err => reject(err)
      //       );
      //     });
      //     // 删除JSON文件
      //     const jsonPath = `_doc/offline/${taskName}/${plotName}/${timestamp}.json`;
      //     const jsonUrl = 'file://' + jsonPath;
      //     await new Promise((resolve, reject) => {
      //       plus.io.resolveLocalFileSystemURL(jsonUrl,
      //         entry => entry.remove(resolve, reject),
      //         err => reject(err)
      //       );
      //     });
      //     // 从内存数据删除对应记录，保持页面同步
      //     for (let t = 0; t < this.records.length; t++) {
      //       if (this.records[t].taskName === taskName) {
      //         for (let p = 0; p < this.records[t].plots.length; p++) {
      //           if (this.records[t].plots[p].plotName === plotName) {
      //             const index = this.records[t].plots[p].items.findIndex(item => item.id === timestamp);
      //             if (index !== -1) {
      //               this.records[t].plots[p].items.splice(index, 1);
      //               if (this.records[t].plots[p].items.length === 0) {
      //                 this.records[t].plots.splice(p, 1);
      //               }
      //               if (this.records[t].plots.length === 0) {
      //                 this.records.splice(t, 1);
      //               }
      //               break;
      //             }
      //           }
      //         }
      //       }
      //     }
      //     uni.showToast({ title: '删除成功', icon: 'success' });
      //   } catch (error) {
      //     __f__('error','at pages/record/record.vue:153','删除失败:', error);
      //     uni.showToast({ title: '删除失败', icon: 'none' });
      //   }
      // },
      //     // 删除整个小区
      //     async deletePlot(taskName, plot, pIndex, tIndex) {
      //       if (!await this.confirmDialog(`确认删除任务【${taskName}】的小区【${plot.plotName}】？（包含所有记录）`)) return;
      //       try {
      //         await this.requestStoragePermission();
      //         await this.removeDir(`_doc/offline/${taskName}/${plot.plotName}`);
      //         this.records[tIndex].plots.splice(pIndex, 1);
      //         if (this.records[tIndex].plots.length === 0) {
      //           this.records.splice(tIndex, 1);
      //         }
      //         uni.showToast({ title: '小区已删除', icon: 'success' });
      //       } catch (e) {
      //         __f__('error','at pages/record/record.vue:173',e);
      //         uni.showToast({ title: '删除失败', icon: 'none' });
      //       }
      //     },
      //     // 删除整个任务
      //     async deleteTask(task, tIndex) {
      //       if (!await this.confirmDialog(`确认删除任务【${task.taskName}】？（包含所有小区和记录）`)) return;
      //       try {
      //         await this.requestStoragePermission();
      //         await this.removeDir(`_doc/offline/${task.taskName}`);
      //         this.records.splice(tIndex, 1);
      //         uni.showToast({ title: '任务已删除', icon: 'success' });
      //       } catch (e) {
      //         __f__('error','at pages/record/record.vue:187',e);
      //         uni.showToast({ title: '删除失败', icon: 'none' });
      //       }
      //     },
      //     // 公共确认弹窗
      //     confirmDialog(content) {
      //       return new Promise(resolve => {
      //         uni.showModal({
      //           title: '确认操作',
      //           content,
      //           success: res => resolve(res.confirm)
      //         });
      //       });
      //     },
      //     // 删除文件夹
      //     removeDir(dirPath) {
      //       return new Promise((resolve, reject) => {
      //         plus.io.resolveLocalFileSystemURL(dirPath, entry => {
      //           entry.removeRecursively(() => resolve(), reject);
      //         }, reject);
      //       });
      //     },
      // 权限请求
      requestStoragePermission() {
        return new Promise((resolve, reject) => {
          if (plus.os.name.toLowerCase() !== "android") {
            resolve(true);
            return;
          }
          const main = plus.android.runtimeMainActivity();
          const permission = "android.permission.WRITE_EXTERNAL_STORAGE";
          const checkPermission = plus.android.importClass("android.content.pm.PackageManager");
          const pkgManager = main.getPackageManager();
          const hasPermission = pkgManager.checkPermission(permission, main.getPackageName());
          if (hasPermission === checkPermission.PERMISSION_GRANTED) {
            resolve(true);
          } else {
            const Permissions = plus.android.importClass("android.support.v4.app.ActivityCompat");
            Permissions.requestPermissions(main, [permission], 0);
            setTimeout(() => resolve(true), 1e3);
          }
        });
      },
      getOrCreateDir(path) {
        return new Promise((resolve, reject) => {
          plus.io.resolveLocalFileSystemURL(path, (dirEntry) => {
            resolve(dirEntry);
          }, () => {
            plus.io.requestFileSystem(plus.io.PRIVATE_DOC, (fs) => {
              fs.root.getDirectory(path.replace("_doc/", ""), { create: true }, (dirEntry) => {
                resolve(dirEntry);
              }, reject);
            }, reject);
          });
        });
      },
      readDirEntries(dirEntry) {
        return new Promise((resolve, reject) => {
          const reader = dirEntry.createReader();
          reader.readEntries((entries) => {
            const names = entries.map((e) => e.name);
            resolve(names);
          }, reject);
        });
      },
      getDirEntry(parentEntry, name) {
        return new Promise((resolve, reject) => {
          parentEntry.getDirectory(name, {}, resolve, reject);
        });
      },
      getFileEntry(dirEntry, name) {
        return new Promise((resolve, reject) => {
          dirEntry.getFile(name, {}, resolve, reject);
        });
      },
      readFileContent(fileEntry) {
        return new Promise((resolve, reject) => {
          fileEntry.file((file) => {
            const reader = new plus.io.FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
          });
        });
      },
      removeFile(filePath) {
        return new Promise((resolve, reject) => {
          let localPath = filePath.startsWith("file://") ? filePath : "file://" + filePath;
          plus.io.resolveLocalFileSystemURL(localPath, (fileEntry) => {
            fileEntry.remove(() => resolve(), reject);
          }, reject);
        });
      }
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("text", { class: "title" }, "离线记录"),
      vue.createElementVNode("scroll-view", {
        class: "record-list",
        "scroll-y": ""
      }, [
        $data.records.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "empty"
        }, "暂无记录")) : vue.createCommentVNode("v-if", true),
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($data.records, (task, tIndex) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              key: tIndex,
              class: "task-block"
            }, [
              vue.createElementVNode("view", { class: "task-header" }, [
                vue.createElementVNode(
                  "text",
                  { class: "task-title" },
                  "📂 " + vue.toDisplayString(task.taskName),
                  1
                  /* TEXT */
                )
              ]),
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(task.plots, (plot, pIndex) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    key: pIndex,
                    class: "plot-block"
                  }, [
                    vue.createElementVNode("view", { class: "plot-header" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "plot-title" },
                        "🏷 " + vue.toDisplayString(plot.plotName),
                        1
                        /* TEXT */
                      )
                    ]),
                    (vue.openBlock(true), vue.createElementBlock(
                      vue.Fragment,
                      null,
                      vue.renderList(plot.items, (record, rIndex) => {
                        return vue.openBlock(), vue.createElementBlock("view", {
                          key: record.id,
                          class: "record-item"
                        }, [
                          vue.createElementVNode("image", {
                            src: record.image,
                            mode: "aspectFill",
                            class: "record-img"
                          }, null, 8, ["src"]),
                          vue.createElementVNode("view", { class: "record-info" }, [
                            vue.createElementVNode(
                              "text",
                              null,
                              "病害：" + vue.toDisplayString(record.diseaseType),
                              1
                              /* TEXT */
                            ),
                            vue.createElementVNode(
                              "text",
                              null,
                              "等级：" + vue.toDisplayString(record.diseaseLevel),
                              1
                              /* TEXT */
                            ),
                            vue.createElementVNode(
                              "text",
                              null,
                              "经度：" + vue.toDisplayString(record.longitude),
                              1
                              /* TEXT */
                            ),
                            vue.createElementVNode(
                              "text",
                              null,
                              "纬度：" + vue.toDisplayString(record.latitude),
                              1
                              /* TEXT */
                            ),
                            vue.createElementVNode(
                              "text",
                              null,
                              "备注：" + vue.toDisplayString(record.remark),
                              1
                              /* TEXT */
                            ),
                            vue.createElementVNode(
                              "text",
                              null,
                              "时间：" + vue.toDisplayString(record.timestamp),
                              1
                              /* TEXT */
                            )
                          ])
                        ]);
                      }),
                      128
                      /* KEYED_FRAGMENT */
                    ))
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ])
    ]);
  }
  const PagesRecordRecord = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1], ["__file", "D:/WeChat Files/wxid_7gwua196xhea12/FileStorage/File/2025-07/狮山云瞳 2/pages/record/record.vue"]]);
  __definePage("pages/login/login", PagesLoginLogin);
  __definePage("pages/index/index", PagesIndexIndex);
  __definePage("pages/message/message", PagesMessageMessage);
  __definePage("pages/task-list/task-list", PagesTaskListTaskList);
  __definePage("pages/task-detail/task-detail", PagesTaskDetailTaskDetail);
  __definePage("pages/collect/collect", PagesCollectCollect);
  __definePage("pages/result/result", PagesResultResult);
  __definePage("pages/offline/offline", PagesOfflineOffline);
  __definePage("pages/record/record", PagesRecordRecord);
  const _sfc_main = {
    onLaunch: function() {
      formatAppLog("log", "at App.vue:7", "App Launch");
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:10", "App Show");
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:13", "App Hide");
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_router_view = vue.resolveComponent("router-view");
    return vue.openBlock(), vue.createBlock(_component_router_view);
  }
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "D:/WeChat Files/wxid_7gwua196xhea12/FileStorage/File/2025-07/狮山云瞳 2/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
