'use strict';

(function(){

var Sprite;

Sprite = (function() {
  class Sprite {
    static load(loader, file) {
      var sprite;
      sprite = Sprite.cache[file];
      if (!sprite) {
        sprite = new Sprite;
        sprite.load(loader, file);
        Sprite.cache[file] = sprite;
      }
      return sprite;
    }

    load(loader, file) {
      loader.loadJson(file, (data1) => {
        this.data = data1;
      });
      return loader.loadImage(file + '.png', (texture) => {
        this.texture = texture;
      });
    }

    draw(g, frame, x, y, index = 0) {
      var data;
      data = this.data;
      if (data) {
        switch (frame.constructor) {
          case Object:
            g.drawImage(this.texture, frame.x, frame.y, frame.w, frame.h, x + frame.cx, y + frame.cy, frame.w, frame.h);
            break;
          case Array:
            this.draw(g, frame[Math.floor(index) % frame.lenght], x, y);
            break;
          case String:
            this.draw(g, data[frame], x, y, index);
        }
      }
      return this;
    }

  }

  Sprite.cache = [];

  return Sprite;

}).call(undefined);

var Animation;
var AnimationData;
var getTime;
var makeEaseInOut;
var makeEaseOut;
var setTimingFunction;
var timingFunctions;

AnimationData = (function() {
  class AnimationData {
    static load(loader, file) {
      var animData;
      animData = AnimationData.cache[file];
      if (!animData) {
        animData = new AnimationData;
        animData.load(loader, file);
        AnimationData.cache[file] = animData;
      }
      return animData;
    }

    load(loader, file) {
      return loader.loadJson(file, (data) => {
        var key, results, value;
        if (data) {
          results = [];
          for (key in data) {
            value = data[key];
            results.push(this[key] = value);
          }
          return results;
        }
      });
    }

  }

  AnimationData.cache = [];

  return AnimationData;

}).call(undefined);

getTime = function() {
  return new Date().getTime() / 1000;
};

makeEaseOut = function(timing) {
  return function(time) {
    return 1 - timing(1 - time);
  };
};

makeEaseInOut = function(timing) {
  return function(time) {
    if (time < 0.5) {
      return timing(2 * time) / 2;
    } else {
      return (2 - timing(2 * (1 - time))) / 2;
    }
  };
};

setTimingFunction = function(name, timing) {
  timingFunctions[name] = timing;
  timingFunctions[name + 'EaseOut'] = makeEaseOut(timing);
  return timingFunctions[name + 'EaseInOut'] = makeEaseInOut(timing);
};

timingFunctions = {
  linear: function(time) {
    return time;
  },
  easeOut: function(time) {
    return 1 - time;
  },
  easeInOut: function(time) {
    if (time < 0.5) {
      return time * 2;
    } else {
      return 2 - time * 2;
    }
  }
};

setTimingFunction('quad', function(time) {
  return time * time;
});

setTimingFunction('circle', function(time) {
  return 1 - Math.sin(Math.acos(time));
});

setTimingFunction('bounce', function(time) {
  var a, b;
  a = 0;
  b = 1;
  while (true) {
    if (time >= (7 - 4 * a) / 11) {
      return -Math.pow((11 - 6 * a - 11 * time) / 4, 2) + Math.pow(b, 2);
    }
    a += b;
    b /= 2;
  }
});

Animation = (function() {
  class Animation {
    reset() {
      this.startTime = getTime();
      this.deltaTime = 0;
      return this;
    }

    set(name, data = this.data) {
      var anim;
      anim = data != null ? data[name] : void 0;
      this.reset();
      if (anim) {
        this.duration = anim.duration || 0;
        this.frame = anim.frames;
      } else {
        this.duration = 0;
        this.frame = null;
      }
      return this;
    }

    play(time) {
      var delta, duration;
      time = time || getTime();
      this.deltaTime = delta = (time - this.startTime) * this.scale;
      duration = this.duration;
      if (!duration) {
        return false;
      }
      if (delta > duration) {
        if (this.loop) {
          this.deltaTime %= duration;
        } else {
          return false;
        }
      }
      return true;
    }

    animate(node, nodePath = node.nodePath, nodeName = node.nodeName) {
      var delta, frame, i, len, name, point, prop, props, propsUsed, ref, ref1, tFunc, time, timestops, toVal;
      if (frame = this.frame) {
        timestops = frame[nodePath] || frame[nodeName];
        if (timestops) {
          delta = this.deltaTime;
          props = Animation.props;
          propsUsed = Animation.propsUsed;
          for (i = 0, len = timestops.length; i < len; i++) {
            point = timestops[i];
            if (delta >= point.end) {
              ref = point.to;
              for (name in ref) {
                toVal = ref[name];
                if (!propsUsed[name]) {
                  props[name] = node[name];
                  propsUsed[name] = true;
                }
                node[name] = toVal;
              }
            } else if (delta >= point.start) {
              if (point.func) {
                tFunc = timingFunctions[point.func];
              } else {
                tFunc = timingFunctions.linear;
              }
              ref1 = point.to;
              
              for (name in ref1) {
                toVal = ref1[name];
                prop = node[name];
                if (!propsUsed[name]) {
                  props[name] = prop;
                  propsUsed[name] = true;
                }
                prop || (prop = 0);
                if (toVal.constructor === Number) {
                  time = tFunc((delta - point.start) / (point.end - point.start));
                  node[name] = (toVal - prop) * time + prop;
                } else {
                  node[name] = toVal;
                }
              }
            }
          }
        }
      }
      return this;
    }

    reciveProps(node) {
      var name, props, propsUsed, use;
      props = Animation.props;
      propsUsed = Animation.propsUsed;
      for (name in propsUsed) {
        use = propsUsed[name];
        if (use) {
          node[name] = props[name];
          delete propsUsed[name];
        }
      }
      return this;
    }

    createWorkFrame() {
      this.loop = false;
      this.frame = {
        work: [
          {
            start: 0,
            end: 0,
            to: {}
          }
        ]
      };
      return this;
    }

    resetWork() {
      var name, propsUsed, use;
      propsUsed = Animation.propsUsed;
      for (name in propsUsed) {
        use = propsUsed[name];
        if (use) {
          propsUsed[name] = false;
        }
      }
      return this;
    }

    clearWork() {
      var _, aObj, name, propsUsed, to;
      aObj = this.frame.work[0];
      aObj.start = aObj.end = 0;
      to = (function() {
        var results;
        results = [];
        for (name in to) {
          _ = to[name];
          results.push(delete to[name]);
        }
        return results;
      })();
      return this;
    }

    animateProps(props, duration, func) {
      var aObj, name, prop, to;
      this.duration = duration;
      aObj = this.frame.work[0];
      aObj.end = duration;
      aObj.func = func;
      to = aObj.to;
      for (name in props) {
        prop = props[name];
        to[name] = prop;
      }
      this.reset();
      return this;
    }

  }

  Animation.getTime = getTime;

  Animation.prototype.loop = true;

  Animation.prototype.startTime = 0;

  Animation.prototype.duration = 0;

  Animation.prototype.deltaTime = 0;

  Animation.prototype.scale = 1;

  Animation.props = [];

  Animation.propsUsed = [];

  return Animation;

}).call(undefined);

var Model;
var ModelData;
var Z_ORIGIN;
var Z_TRANSFORM;
var drawNode;
var drawPart;
var drawPartType;
var drawTypeObj;
var initStyle;
var setDrawStyle;
var styleTypeFunc;
var transform;
var transformVert;
var trsfObj;

ModelData = (function() {
  class ModelData {
    static load(loader, file) {
      var model;
      model = ModelData.cache[file];
      if (!model) {
        model = new ModelData;
        model.load(loader, file);
        ModelData.cache[file] = model;
      }
      return model;
    }

    load(loader, file) {
      return loader.loadJson(file, (data) => {
        var image, imagesData, key, model, modelsData, nodesLoad, sprite, spritesData, value;
        if (data) {
          for (key in data) {
            value = data[key];
            this[key] = value;
          }
          if (this.images) {
            imagesData = this.images;
            this.images = [];
            for (key in imagesData) {
              image = imagesData[key];
              this.images[key] = loader.loadImage(image);
            }
          }
          if (this.sprites) {
            spritesData = this.sprites;
            this.sprites = [];
            for (key in spritesData) {
              sprite = spritesData[key];
              this.sprites[key] = Sprite.load(loader, sprite);
            }
          }
          if (this.models) {
            modelsData = this.models;
            this.models = [];
            for (key in modelsData) {
              model = modelsData[key];
              this.models[key] = ModelData.load(loader, model);
            }
          }
          nodesLoad = function(nodes, nodePath = '') {
            var name, node, results;
            results = [];
            for (name in nodes) {
              node = nodes[name];
              node.nodePath = nodePath + name;
              node.nodeName = '@' + name;
              if (node.before) {
                nodesLoad(node.before, node.nodePath + '<');
              }
              if (node.after) {
                results.push(nodesLoad(node.after, node.nodePath + '>'));
              } else {
                results.push(void 0);
              }
            }
            return results;
          };
          if (this.bones) {
            return nodesLoad(this.bones);
          }
        }
      });
    }

  }

  ModelData.cache = [];

  return ModelData;

}).call(undefined);

drawTypeObj = {
  line: function(g) {
    g.moveTo(this.x1 || 0, this.y1 || 0);
    g.lineTo(this.x2 || 0, this.y2 || 0);
    return this;
  },
  rect: function(g) {
    g.rect(this.x || 0, this.y || 0, this.width || 1, this.height || 1);
    return this;
  },
  rectRound: function(g) {
    var h, r, w, x, y;
    this.noClose = false;
    x = this.x || 0;
    y = this.y || 0;
    w = this.width;
    h = this.height;
    r = this.radius;
    if (w < 2 * r) {
      r = w / 2;
    }
    if (h < 2 * r) {
      r = h / 2;
    }
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    return this;
  },
  arc: function(g) {
    g.arc(this.x || 0, this.y || 0, this.radius, (this.startAngle || 0) * Math.PI / 180, (this.endAngle || 360) * Math.PI / 180, this.clockwise ? false : true);
    return this;
  },
  elipse: function(g) {
    g.ellipse(this.x || 0, this.y || 0, this.rx, this.ry, (this.rotation || 0) * Math.PI / 180, (this.startAngle || 0) * Math.PI / 180, (this.endAngle || 360) * Math.PI / 180, this.clockwise ? false : true);
    return this;
  },
  path: function(g) {
    var draw, x, y;
    x = this.x || 0;
    y = this.y || 0;
    if (typeof this.path === 'string') {
      this.path = new Path2D(this.path);
    }
    
    this.noClose = true;
    g.translate(x, y);
    draw = this.draw || 'f&s';
    if (draw === 'f' || draw === 'f&s') {
      g.fill(this.path);
    }
    if (draw === 's' || draw === 'f&s') {
      g.stroke(this.path);
    }
    return this;
  },
  node: function(g, model, opacity, data) {
    var j, len, node, nodes, path, ref, root, tData;
    this.noClose = this.draw = true;
    // Save current model data
    tData = model.data;
    // Select model
    data = data || ((ref = tData.models) != null ? ref[this.model] : void 0);
    if (data) {
      model.data = data;
      nodes = data.bones;
    } else {
      nodes = model.data.bones;
    }
    if (nodes) {
      // Select node in model
      node = this.node;
      if (typeof node === 'string') {
        node = nodes[node];
      } else {
        root = nodes;
        for (j = 0, len = node.length; j < len; j++) {
          path = node[j];
          root = root[path];
        }
        node = root;
      }
      if (node) {
        g.translate(this.x || 0, this.y || 0);
        drawNode.call(node, g, model, opacity);
      }
    }
    // Recive model data
    model.data = tData;
    return this;
  },
  attach: function(g, model, opacity) {
    var data;
    data = model.attachment[this.attach];
    if (data) {
      drawTypeObj.node.call(this, g, model, opacity, data);
    }
    return this;
  },
  image: function(g, model) {
    var image;
    this.noClose = this.draw = true;
    image = model.data.images[this.image];
    if (this.width || this.height) {
      g.drawImage(image, this.x || 0, this.y || 0, this.width, this.height);
    } else {
      g.drawImage(image, this.x || 0, this.y || 0);
    }
    return this;
  },
  sprite: function(g, model) {
    var sprite;
    this.noClose = this.draw = true;
    sprite = this.sprite;
    if (sprite.constructor === String) {
      this.sprite = sprite = model.data.sprites[sprite];
    }
    sprite.draw(g, this.frame, this.x || 0, this.y || 0, this.index);
    return this;
  },
  text: function(g) {
    var draw;
    if (this.draw !== true) {
      this.drawText = this.draw;
    }
    draw = this.drawText;
    this.noClose = this.draw = true;
    
    if (this.font) {
      g.font = this.font;
    }
    if (this.textAlign) {
      g.textAlign = this.textAlign;
    }
    if (this.textBaseline !== null) {
      g.textBaseline = this.textBaseline;
    }
    if (this.direction) {
      g.direction = this.direction;
    }
    
    if (draw === 'f' || draw === 'f&s') {
      g.fillText(this.text, this.x || 0, this.y || 0, this.maxWidth);
    }
    if (draw === 's' || draw === 'f&s') {
      g.strokeText(this.text, this.x || 0, this.y || 0, this.maxWidth);
    }
    return this;
  }
};

styleTypeFunc = {
  linear: function(g) {
    var colorStop, gradient, j, len, ref;
    gradient = g.createLinearGradient(this.x0 || 0, this.y0 || 0, this.x1 || 0, this.y1 || 0);
    ref = this.colorStops;
    for (j = 0, len = ref.length; j < len; j++) {
      colorStop = ref[j];
      gradient.addColorStop(colorStop.pos || 0, colorStop.color);
    }
    return gradient;
  },
  radial: function(g) {
    var colorStop, gradient, j, len, ref;
    gradient = g.createRadialGradient(this.x0 || 0, this.y0 || 0, this.r0 || 0, this.x1 || 0, this.y1 || 0, this.r1 || 0);
    ref = this.colorStops;
    for (j = 0, len = ref.length; j < len; j++) {
      colorStop = ref[j];
      gradient.addColorStop(colorStop.pos || 0, colorStop.color);
    }
    return gradient;
  },
  pattern: function(g, model) {
    var image;
    image = model.data.images[this.image];
    return g.createPattern(image, this.repetition || "repeat");
  }
};

initStyle = function(g, model, style) {
  var ref;
  return (ref = styleTypeFunc[style.type]) != null ? ref.call(style, g, model) : void 0;
};

setDrawStyle = function(g, model) {
  var fill, stroke;
  stroke = this.stroke;
  if (stroke) {
    if (stroke.constructor === Object) {
      this.stroke = initStyle(g, model, stroke);
    }
    g.strokeStyle = this.stroke;
  }
  fill = this.fill;
  if (fill) {
    if (fill.constructor === Object) {
      this.fill = initStyle(g, model, fill);
    }
    g.fillStyle = this.fill;
  }
  if (this.lineWidth !== null) {
    g.lineWidth = this.lineWidth;
  }
  if (this.lineCap !== null) {
    g.lineCap = this.lineCap;
  }
  if (this.lineJoin) {
    g.lineJoin = this.lineJoin;
  }
  if (this.lineDashOffset !== null) {
    g.lineDashOffset = this.lineDashOffset;
  }
  return this;
};

drawNode = function(g, model, opacity) {
  var draw, key, node, ref, ref1, ref2;
  g.save();
  model.animation.animate(this);
  g.transform(this.scaleX || 1, this.skewY || 0, this.skewX || 0, this.scaleY || 1, this.origX || 0, this.origY || 0);
  if (this.angle) {
    g.rotate(this.angle * Math.PI / 180);
  }
  setDrawStyle.call(this, g, model);
  // Shadows
  if (this.noShadow) {
    g.shadowBlur = 0;
    g.shadowOffsetX = 0;
    g.shadowOffsetY = 0;
  }
  if (this.shadowBlur !== null) {
    g.shadowBlur = this.shadowBlur;
  }
  if (this.shadowColor !== null) {
    g.shadowColor = this.shadowColor;
  }
  if (this.shadowOffsetX !== null) {
    g.shadowOffsetX = this.shadowOffsetX;
  }
  if (this.shadowOffsetY !== null) {
    g.shadowOffsetY = this.shadowOffsetY;
  }
  g.globalAlpha = opacity * (this.opacity === null ? 1 : this.opacity);
  if (this.before) {
    model.animation.reciveProps(this);
    ref = this.before;
    
    for (key in ref) {
      node = ref[key];
      if (!node.hide) {
        drawNode.call(node, g, model, opacity);
      }
    }
    
    model.animation.animate(this);
  }
  g.beginPath();
  if ((ref1 = drawTypeObj[this.type]) != null) {
    ref1.call(this, g, model, opacity);
  }
  if (!this.noClose) {
    g.closePath();
  }
  draw = this.draw || 'f&s';
  if (draw === 'f' || draw === 'f&s') {
    g.fill();
  }
  if (draw === 's' || draw === 'f&s') {
    g.stroke();
  }
  if (this.clip) {
    g.clip();
  }
  model.animation.reciveProps(this);
  if (this.after) {
    ref2 = this.after;
    for (key in ref2) {
      node = ref2[key];
      if (!node.hide) {
        drawNode.call(node, g, model, opacity);
      }
    }
  }
  if (Model.drawOrigin) {
    g.fillStyle = '#f00';
    g.shadowBlur = 0;
    g.shadowOffsetX = 0;
    g.shadowOffsetY = 0;
    g.fillRect(-2, -2, 4, 4);
  }
  g.restore();
  return this;
};

drawPartType = {
  poly: function(g, verts, camera, model) {
    var i, j, l, ref, v, x, xc, y, yc, z, zt;
    v = verts[this.verts[0]];
    xc = camera.x;
    yc = camera.y;
    zt = Z_ORIGIN + camera.z;
    z = ((v.z || 0) + zt) * Z_TRANSFORM;
    x = ((v.x || 0) + xc) * z;
    y = ((v.y || 0) + yc) * z;
    g.moveTo(x, y);
    l = this.verts.length - 1;
    for (i = j = 1, ref = l; (1 <= ref ? j <= ref : j >= ref); i = 1 <= ref ? ++j : --j) {
      v = verts[this.verts[i]];
      z = ((v.z || 0) + zt) * Z_TRANSFORM;
      x = ((v.x || 0) + xc) * z;
      y = ((v.y || 0) + yc) * z;
      g.lineTo(x, y);
    }
    return this;
  },
  part: function(g, verts, camera, model, opacity) {
    var c, data, face, j, len, part, parts, ref, ref1, tData, tParts, v;
    this.noClose = this.draw = true;
    // Save model data
    tData = model.data;
    // Select model
    data = (ref = tData.models) != null ? ref[this.model] : void 0;
    if (data) {
      model.data = data;
      parts = data.parts;
    } else {
      parts = model.data.parts;
    }
    if (parts) {
      v = verts[this.vert];
      c = {
        x: camera.x + (v.x || 0),
        y: camera.y + (v.y || 0),
        z: camera.z + (v.z || 0)
      };
      part = parts[this.part];
      if (part) {
        tParts = model.parts;
        model.parts = parts;
        ref1 = part.faces;
        for (j = 0, len = ref1.length; j < len; j++) {
          face = ref1[j];
          drawPart.call(face, g, model, c, opacity);
        }
        model.parts = tParts;
      }
    }
    model.data = tData;
    return this;
  },
  node: function(g, verts, camera, model, opacity) {
    transformVert(verts[this.vert], camera).apply(g);
    drawTypeObj.node.call(this, g, model, opacity);
    return this;
  },
  attach: function(g, model, opacity) {
    var data;
    transformVert(verts[this.vert], camera).apply(g);
    data = model.attachment[this.attach];
    if (data) {
      drawTypeObj.node.call(this, g, model, opacity, data);
    }
    return this;
  },
  elipse: function(g, verts, camera) {
    var rx, ry, v, x1, x2, y1, y2;
    v = transformVert(verts[this.vert1], camera);
    x1 = v.x;
    y1 = v.y;
    v = transformVert(verts[this.vert2], camera);
    x2 = v.x;
    y2 = v.y;
    rx = (x2 - x1) / 2;
    ry = (y2 - y1) / 2;
    g.ellipse(x1 + rx, y1 + ry, rx, ry, (this.rotation || 0) * Math.PI / 180, (this.startAngle || 0) * Math.PI / 180, (this.endAngle || 360) * Math.PI / 180, this.clockwise ? false : true);
    return this;
  }
};

drawPart = function(g, model, camera, opacity) {
  var draw, ref, stroke;
  g.save();
  stroke = this.stroke;
  setDrawStyle.call(this, g, model);
  g.globalAlpha = opacity * (this.opacity === null ? 1 : this.opacity);
  g.beginPath();
  if ((ref = drawPartType[this.type || 'poly']) != null) {
    ref.call(this, g, model.data.verts, camera, model, opacity);
  }
  if (!this.noClose) {
    g.closePath();
  }
  draw = this.draw || 'f&s';
  if (draw === 'f' || draw === 'f&s') {
    g.fill();
  }
  if (draw === 's' || draw === 'f&s') {
    g.stroke();
  }
  g.restore();
  return this;
};

Z_TRANSFORM = 0.0002;

Z_ORIGIN = 1 / Z_TRANSFORM;

trsfObj = {
  x: 0,
  y: 0,
  scale: 1,
  apply: function(g) {
    return g.transform(this.scale, 0, 0, this.scale, this.x, this.y);
  }
};

Model = class Model {
  static transform(x, y, z, camera) {
    z = (Z_ORIGIN + z + camera.z) * Z_TRANSFORM;
    trsfObj.x = (x + camera.x) * z;
    trsfObj.y = (y + camera.y) * z;
    trsfObj.scale = z;
    return trsfObj;
  }

  constructor(data1) {
    this.data = data1;
    this.attachment = [];
    this.animation = new Animation;
  }

  setData(data1) {
    this.data = data1;
  }

  draw2D(g, opacity = 1) {
    var bones, key, node, ref, results;
    if (bones = (ref = this.data) != null ? ref.bones : void 0) {
      results = [];
      for (key in bones) {
        node = bones[key];
        if (!node.hide) {
          results.push(drawNode.call(node, g, this, opacity));
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  }

  drawNode(g, node, opacity = 1) {
    var bones, ref;
    if (bones = (ref = this.data) != null ? ref.bones : void 0) {
      node = bones[node];
      if (node) {
        return drawNode.call(node, g, this, opacity);
      }
    }
  }

  drawPart(g, part, camera, opacity = 1) {
    var face, j, len, ref, results;
    ref = part.faces;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      face = ref[j];
      results.push(drawPart.call(face, g, this, camera, opacity));
    }
    return results;
  }

  drawParts(g, camera, opacity = 1) {
    var _, face, part, parts, ref, results;
    if (parts = (ref = this.data) != null ? ref.parts : void 0) {
      results = [];
      for (_ in parts) {
        part = parts[_];
        if (!part.hide) {
          results.push((function() {
            var j, len, ref1, results1;
            ref1 = part.faces;
            results1 = [];
            for (j = 0, len = ref1.length; j < len; j++) {
              face = ref1[j];
              results1.push(drawPart.call(face, g, this, camera, opacity));
            }
            return results1;
          }).call(this));
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  }

};

transform = Model.transform;

transformVert = function(v, camera) {
  return transform(v.x || 0, v.y || 0, v.z || 0, camera);
};

var EventEmmiter;

EventEmmiter = (function() {
  class EventEmmiter {
    on(event, callback) {
      var handler;
      if (callback) {
        handler = this.handlers[event];
        if (!handler) {
          this.handlers[event] = handler = [];
        }
        if (handler.indexOf(callback) < 0) {
          handler.push(callback);
        }
      }
      return this;
    }

    off(event, callback) {
      var handler, index;
      if (callback) {
        handler = this.handlers[event];
        if (handler) {
          index = handler.indexOf(callback);
          if (index >= 0) {
            handler.splice(index, 1);
          }
        }
      }
      return this;
    }

    trigger(event, args) {
      var callback, handler, i, len;
      handler = this.handlers[event];
      if (handler) {
        for (i = 0, len = handler.length; i < len; i++) {
          callback = handler[i];
          callback.apply(this, args);
        }
      }
      return this;
    }

    removeEvent(event) {
      delete this.handlers[event];
      return this;
    }

  }

  EventEmmiter.prototype.handlers = [];

  return EventEmmiter;

}).call(undefined);

var Loader;

Loader = (function() {
  var allResLoader, loadResNumber;

  // Events:
  // 'changepercent' trigger when some resorces loaded
  // 'load' trigger when all resorces loaded
  class Loader extends EventEmmiter {
    reset() {
      return loadResNumber = allResLoader = 0;
    }

    getPercent() {
      return 1 - (allResLoader !== 0 ? loadResNumber / allResLoader : 0);
    }

    updatePercent() {
      return this.trigger('changepercent', [this.getPercent()]);
    }

    load(callback) {
      var _this;
      _this = this;
      loadResNumber++;
      allResLoader++;
      return function() {        // @updatePercent()
        if (callback != null) {
          callback.apply(_this, arguments);
        }
        loadResNumber--;
        if (loadResNumber <= 0) {
          _this.reset();
          _this.trigger('load');
        }
        return _this.updatePercent();
      };
    }

    loadJson(file, callback) {
      callback = this.load(callback);
      return $.getJSON(file + '.json').done(callback).fail(function() {
        return callback(null);
      });
    }

    loadImage(file, callback) {
      var img;
      callback = this.load(callback);
      img = new Image;
      img.onload = function() {
        return callback(img);
      };
      img.src = file;
      return img;
    }

  }

  loadResNumber = 0;

  allResLoader = 0;

  return Loader;

}).call(undefined);

$(document).ready(function() {
  var $canvas, animationFrame, camera, cancelFullscreen, canvas, context, fullscreen, launchFullScreen, loader, mRefreshInterval, model, modelData, modelFile, modelRefresh, moveCamera, oldMouseX, oldMouseY, render, resize;
  $canvas = $('#canvas');
  canvas = $canvas.get(0);
  context = canvas.getContext('2d', {
    alpha: false
  });
  modelFile = 'models/arena';
  loader = new Loader;
  model = new Model;
  modelData = new ModelData;
  animationFrame = null;
  camera = {
    canvas: canvas,
    g: context,
    x: 0,
    y: 0,
    z: 0
  };
  resize = function() {
    canvas.width = $(window).width();
    return canvas.height = $(window).height() - $('#canvas').offset().top;
  };
  resize();
  $(window).on('resize', resize);
  modelRefresh = function() {
    //		for key, _ of modelData
    //			delete modelData[key]
    return modelData.load(loader, modelFile);
  };
  loader.on('load', function() {
    var _, anim, container, ref;
    model.setData(modelData);
    if (model.animation.data) {
      // model.animation.set 'test'

      container = $('.js-frame-container');
      container.empty();
      ref = model.animation.data;
      for (anim in ref) {
        _ = ref[anim];
        container.append(`<a class='dropdown-item js-frame-select' href='#'>${anim}</a>`);
      }
      model.animation.set(animationFrame);
      return $('.js-frame-select').click(function() {
        animationFrame = $(this).text();
        return model.animation.set(animationFrame);
      });
    }
  });
  console.log(model);
  mRefreshInterval = setInterval(modelRefresh, 500);
  render = function(delta) {
    var cx, cy, h, w;
    context.save();
    w = canvas.width;
    h = canvas.height;
    cx = w / 2;
    cy = h / 2;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, w, h);
    context.beginPath();
    context.lineWidth = 2;
    context.strokeStyle = '#f00';
    context.moveTo(cx, 0);
    context.lineTo(cx, h);
    context.moveTo(0, cy);
    context.lineTo(w, cy);
    context.stroke();
    context.translate(cx, cy);
    model.animation.play();
    model.drawParts(context, camera);
    Model.transform(0, 0, 0, camera).apply(context);
    model.draw2D(context);
    context.restore();
    
    return window.requestAnimationFrame(render);
  };
  render(0);
  oldMouseX = oldMouseY = 0;
  moveCamera = function(e) {
    camera.x += e.clientX - oldMouseX;
    camera.y += e.clientY - oldMouseY;
    oldMouseX = e.clientX;
    return oldMouseY = e.clientY;
  };
  $canvas.on('mousedown', function(e) {
    oldMouseX = e.clientX;
    oldMouseY = e.clientY;
    return $canvas.on('mousemove', moveCamera);
  });
  $canvas.on('touchstart', function(e) {
    oldMouseX = e.touches[0].clientX;
    return oldMouseY = e.touches[0].clientY;
  });
  $canvas.on('touchmove', function(e) {
    return moveCamera(e.touches[0]);
  });
  $canvas.on('mouseup', function() {
    return $canvas.off('mousemove', moveCamera);
  });
  $('.js-z-number').val(camera.z).on('input change', function() {
    return camera.z = +$(this).val();
  });
  $('.js-model-select').click(function() {
    modelData = new ModelData;
    return modelFile = $(this).data('file');
  });
  $('.js-anim-select').click(function() {
    var file;
    file = $(this).data('file');
    model.animation.data = new AnimationData;
    model.animation.data.load(loader, file);
    $('.js-anim-refresh').data('file', file);
    
    $('.js-refresh-model').prop('checked', false);
    return clearInterval(mRefreshInterval);
  });
  Model.drawOrigin = true;
  $('.js-draw-origin').change(function() {
    return Model.drawOrigin = $(this).prop('checked');
  });
  $('.js-refresh-model').change(function() {
    if ($(this).prop('checked')) {
      return mRefreshInterval = setInterval(modelRefresh, 500);
    } else {
      return clearInterval(mRefreshInterval);
    }
  });
  $('.js-reset-pos').click(function() {
    camera.x = camera.y = camera.z = 0;
    return $('.js-z-number').val('0');
  });
  fullscreen = false;
  $('.js-full-screen').click(function() {
    if (fullscreen) {
      cancelFullscreen();
    } else {
      launchFullScreen(document.documentElement);
    }
    return fullscreen = !fullscreen;
  });
  launchFullScreen = function(element) {
    if (element.requestFullScreen) {
      return element.requestFullScreen();
    } else if (element.mozRequestFullScreen) {
      return element.mozRequestFullScreen();
    } else if (element.webkitRequestFullScreen) {
      return element.webkitRequestFullScreen();
    }
  };
  return cancelFullscreen = function() {
    if (document.cancelFullScreen) {
      return document.cancelFullScreen();
    } else if (document.mozCancelFullScreen) {
      return document.mozCancelFullScreen();
    } else if (document.webkitCancelFullScreen) {
      return document.webkitCancelFullScreen();
    }
  };
});

})();

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsic3ByaXRlLmNvZmZlZSIsImFuaW1hdGlvbi5jb2ZmZWUiLCJtb2RlbC5jb2ZmZWUiLCJldmVudHMuY29mZmVlIiwibG9hZGVyLmNvZmZlZSIsIm1haW4uY29mZmVlIl0sInNvdXJjZXNDb250ZW50IjpbImNsYXNzIFNwcml0ZVxyXG5cdEBjYWNoZTogW11cclxuXHJcblx0QGxvYWQ6IChsb2FkZXIsIGZpbGUpIC0+XHJcblx0XHRzcHJpdGUgPSBTcHJpdGUuY2FjaGVbZmlsZV1cclxuXHRcdHVubGVzcyBzcHJpdGVcclxuXHRcdFx0c3ByaXRlID0gbmV3IFNwcml0ZVxyXG5cdFx0XHRzcHJpdGUubG9hZCBsb2FkZXIsIGZpbGVcclxuXHRcdFx0U3ByaXRlLmNhY2hlW2ZpbGVdID0gc3ByaXRlXHJcblx0XHRzcHJpdGVcclxuXHJcblx0bG9hZDogKGxvYWRlciwgZmlsZSkgLT5cclxuXHRcdGxvYWRlci5sb2FkSnNvbiBmaWxlLCAoQGRhdGEpID0+XHJcblx0XHRsb2FkZXIubG9hZEltYWdlIGZpbGUgKyAnLnBuZycsIChAdGV4dHVyZSkgPT5cclxuXHJcblx0ZHJhdzogKGcsIGZyYW1lLCB4LCB5LCBpbmRleCA9IDApIC0+XHJcblx0XHRkYXRhID0gQGRhdGFcclxuXHRcdGlmIGRhdGFcclxuXHRcdFx0c3dpdGNoIGZyYW1lLmNvbnN0cnVjdG9yXHJcblx0XHRcdFx0d2hlbiBPYmplY3RcclxuXHRcdFx0XHRcdGcuZHJhd0ltYWdlIEB0ZXh0dXJlLFxyXG5cdFx0XHRcdFx0XHRmcmFtZS54LCBmcmFtZS55LCBmcmFtZS53LCBmcmFtZS5oLFxyXG5cdFx0XHRcdFx0XHR4ICsgZnJhbWUuY3gsIHkgKyBmcmFtZS5jeSwgZnJhbWUudywgZnJhbWUuaFxyXG5cdFx0XHRcdHdoZW4gQXJyYXlcclxuXHRcdFx0XHRcdEBkcmF3IGcsIGZyYW1lW01hdGguZmxvb3IoaW5kZXgpICUgZnJhbWUubGVuZ2h0XSwgeCwgeVxyXG5cdFx0XHRcdHdoZW4gU3RyaW5nXHJcblx0XHRcdFx0XHRAZHJhdyBnLCBkYXRhW2ZyYW1lXSwgeCwgeSwgaW5kZXhcclxuXHRcdHRoaXNcclxuXHJcbmV4cG9ydCB7IFNwcml0ZSB9IiwiY2xhc3MgQW5pbWF0aW9uRGF0YVxyXG5cdEBjYWNoZTogW11cclxuXHJcblx0QGxvYWQ6IChsb2FkZXIsIGZpbGUpIC0+XHJcblx0XHRhbmltRGF0YSA9IEFuaW1hdGlvbkRhdGEuY2FjaGVbZmlsZV1cclxuXHRcdHVubGVzcyBhbmltRGF0YVxyXG5cdFx0XHRhbmltRGF0YSA9IG5ldyBBbmltYXRpb25EYXRhXHJcblx0XHRcdGFuaW1EYXRhLmxvYWQgbG9hZGVyLCBmaWxlXHJcblx0XHRcdEFuaW1hdGlvbkRhdGEuY2FjaGVbZmlsZV0gPSBhbmltRGF0YVxyXG5cdFx0YW5pbURhdGFcclxuXHJcblx0bG9hZDogKGxvYWRlciwgZmlsZSkgLT5cclxuXHRcdGxvYWRlci5sb2FkSnNvbiBmaWxlLCAoZGF0YSkgPT5cclxuXHRcdFx0aWYgZGF0YVxyXG5cdFx0XHRcdGZvciBrZXksIHZhbHVlIG9mIGRhdGFcclxuXHRcdFx0XHRcdHRoaXNba2V5XSA9IHZhbHVlXHJcblxyXG5nZXRUaW1lID0gLT5cclxuXHRuZXcgRGF0ZSgpLmdldFRpbWUoKSAvIDEwMDBcclxuXHJcbm1ha2VFYXNlT3V0ID0gKHRpbWluZykgLT5cclxuXHQodGltZSkgLT5cclxuXHRcdDEgLSB0aW1pbmcoMSAtIHRpbWUpXHJcblxyXG5tYWtlRWFzZUluT3V0ID0gKHRpbWluZykgLT5cclxuXHQodGltZSkgLT5cclxuXHRcdGlmIHRpbWUgPCAwLjVcclxuXHRcdFx0dGltaW5nKDIgKiB0aW1lKSAvIDJcclxuXHRcdGVsc2VcclxuXHRcdFx0KDIgLSB0aW1pbmcoMiAqICgxIC0gdGltZSkpKSAvIDJcclxuXHJcblxyXG5zZXRUaW1pbmdGdW5jdGlvbiA9IChuYW1lLCB0aW1pbmcpIC0+XHJcblx0dGltaW5nRnVuY3Rpb25zW25hbWVdID0gdGltaW5nXHJcblx0dGltaW5nRnVuY3Rpb25zW25hbWUgKyAnRWFzZU91dCddID0gbWFrZUVhc2VPdXQgdGltaW5nXHJcblx0dGltaW5nRnVuY3Rpb25zW25hbWUgKyAnRWFzZUluT3V0J10gPSBtYWtlRWFzZUluT3V0IHRpbWluZ1xyXG5cclxudGltaW5nRnVuY3Rpb25zID1cclxuXHRsaW5lYXI6ICh0aW1lKSAtPlxyXG5cdFx0dGltZVxyXG5cclxuXHRlYXNlT3V0OiAodGltZSkgLT5cclxuXHRcdDEgLSB0aW1lXHJcblxyXG5cdGVhc2VJbk91dDogKHRpbWUpIC0+XHJcblx0XHRpZiB0aW1lIDwgMC41XHJcblx0XHRcdHRpbWUgKiAyXHJcblx0XHRlbHNlXHJcblx0XHRcdDIgLSB0aW1lICogMlxyXG5cclxuc2V0VGltaW5nRnVuY3Rpb24gJ3F1YWQnLCAodGltZSkgLT5cclxuXHR0aW1lICogdGltZVxyXG5cclxuc2V0VGltaW5nRnVuY3Rpb24gJ2NpcmNsZScsICh0aW1lKSAtPlxyXG5cdDEgLSBNYXRoLnNpbiBNYXRoLmFjb3MgdGltZVxyXG5cclxuc2V0VGltaW5nRnVuY3Rpb24gJ2JvdW5jZScsICh0aW1lKSAtPlxyXG5cdGEgPSAwXHJcblx0YiA9IDFcclxuXHR3aGlsZSB0cnVlXHJcblx0XHRpZiB0aW1lID49ICg3IC0gNCAqIGEpIC8gMTFcclxuXHRcdFx0cmV0dXJuIC1NYXRoLnBvdygoMTEgLSA2ICogYSAtIDExICogdGltZSkgLyA0LCAyKSArIE1hdGgucG93KGIsIDIpXHJcblx0XHRhICs9IGJcclxuXHRcdGIgLz0gMlxyXG5cclxuY2xhc3MgQW5pbWF0aW9uXHJcblx0QGdldFRpbWU6IGdldFRpbWVcclxuXHJcblx0bG9vcDogdHJ1ZVxyXG5cdHN0YXJ0VGltZTogMFxyXG5cdGR1cmF0aW9uOiAwXHJcblx0ZGVsdGFUaW1lOiAwXHJcblx0c2NhbGU6IDFcclxuXHJcblx0QHByb3BzOiBbXVxyXG5cdEBwcm9wc1VzZWQ6IFtdXHJcblxyXG5cdHJlc2V0OiAtPlxyXG5cdFx0QHN0YXJ0VGltZSA9IGdldFRpbWUoKVxyXG5cdFx0QGRlbHRhVGltZSA9IDBcclxuXHRcdHRoaXNcclxuXHJcblx0c2V0OiAobmFtZSwgZGF0YSA9IEBkYXRhKSAtPlxyXG5cdFx0YW5pbSA9IGRhdGE/W25hbWVdXHJcblx0XHRAcmVzZXQoKVxyXG5cdFx0aWYgYW5pbVxyXG5cdFx0XHRAZHVyYXRpb24gPSBhbmltLmR1cmF0aW9uIHx8IDBcclxuXHRcdFx0QGZyYW1lID0gYW5pbS5mcmFtZXNcclxuXHRcdGVsc2VcclxuXHRcdFx0QGR1cmF0aW9uID0gMFxyXG5cdFx0XHRAZnJhbWUgPSBudWxsXHJcblx0XHR0aGlzXHJcblxyXG5cdHBsYXk6ICh0aW1lKSAtPlxyXG5cdFx0dGltZSA9IHRpbWUgfHwgZ2V0VGltZSgpXHJcblx0XHRAZGVsdGFUaW1lID0gZGVsdGEgPSAodGltZSAtIEBzdGFydFRpbWUpICogQHNjYWxlXHJcblx0XHRkdXJhdGlvbiA9IEBkdXJhdGlvblxyXG5cdFx0dW5sZXNzIGR1cmF0aW9uXHJcblx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0aWYgZGVsdGEgPiBkdXJhdGlvblxyXG5cdFx0XHRpZiBAbG9vcFxyXG5cdFx0XHRcdEBkZWx0YVRpbWUgJT0gZHVyYXRpb25cclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0dHJ1ZVxyXG5cclxuXHRhbmltYXRlOiAobm9kZSwgbm9kZVBhdGggPSBub2RlLm5vZGVQYXRoLCBub2RlTmFtZSA9IG5vZGUubm9kZU5hbWUpIC0+XHJcblx0XHRpZiBmcmFtZSA9IEBmcmFtZVxyXG5cdFx0XHR0aW1lc3RvcHMgPSBmcmFtZVtub2RlUGF0aF0gfHwgZnJhbWVbbm9kZU5hbWVdXHJcblx0XHRcdGlmIHRpbWVzdG9wc1xyXG5cdFx0XHRcdGRlbHRhID0gQGRlbHRhVGltZVxyXG5cdFx0XHRcdHByb3BzID0gQW5pbWF0aW9uLnByb3BzXHJcblx0XHRcdFx0cHJvcHNVc2VkID0gQW5pbWF0aW9uLnByb3BzVXNlZFxyXG5cdFx0XHRcdGZvciBwb2ludCBpbiB0aW1lc3RvcHNcclxuXHRcdFx0XHRcdGlmIGRlbHRhID49IHBvaW50LmVuZFxyXG5cdFx0XHRcdFx0XHRmb3IgbmFtZSwgdG9WYWwgb2YgcG9pbnQudG9cclxuXHRcdFx0XHRcdFx0XHR1bmxlc3MgcHJvcHNVc2VkW25hbWVdXHJcblx0XHRcdFx0XHRcdFx0XHRwcm9wc1tuYW1lXSA9IG5vZGVbbmFtZV1cclxuXHRcdFx0XHRcdFx0XHRcdHByb3BzVXNlZFtuYW1lXSA9IHRydWVcclxuXHRcdFx0XHRcdFx0XHRub2RlW25hbWVdID0gdG9WYWxcclxuXHRcdFx0XHRcdGVsc2UgaWYgZGVsdGEgPj0gcG9pbnQuc3RhcnRcclxuXHRcdFx0XHRcdFx0aWYgcG9pbnQuZnVuY1xyXG5cdFx0XHRcdFx0XHRcdHRGdW5jID0gdGltaW5nRnVuY3Rpb25zW3BvaW50LmZ1bmNdXHJcblx0XHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0XHR0RnVuYyA9IHRpbWluZ0Z1bmN0aW9ucy5saW5lYXJcclxuXHRcdFx0XHRcdFx0I1xyXG5cdFx0XHRcdFx0XHRmb3IgbmFtZSwgdG9WYWwgb2YgcG9pbnQudG9cclxuXHRcdFx0XHRcdFx0XHRwcm9wID0gbm9kZVtuYW1lXVxyXG5cdFx0XHRcdFx0XHRcdHVubGVzcyBwcm9wc1VzZWRbbmFtZV1cclxuXHRcdFx0XHRcdFx0XHRcdHByb3BzW25hbWVdID0gcHJvcFxyXG5cdFx0XHRcdFx0XHRcdFx0cHJvcHNVc2VkW25hbWVdID0gdHJ1ZVxyXG5cdFx0XHRcdFx0XHRcdHByb3AgfHw9IDBcclxuXHRcdFx0XHRcdFx0XHRpZiB0b1ZhbC5jb25zdHJ1Y3RvciA9PSBOdW1iZXJcclxuXHRcdFx0XHRcdFx0XHRcdHRpbWUgPSB0RnVuYygoZGVsdGEgLSBwb2ludC5zdGFydCkgLyAocG9pbnQuZW5kIC0gcG9pbnQuc3RhcnQpKVxyXG5cdFx0XHRcdFx0XHRcdFx0bm9kZVtuYW1lXSA9ICh0b1ZhbCAtIHByb3ApICogdGltZSArIHByb3BcclxuXHRcdFx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdFx0XHRub2RlW25hbWVdID0gdG9WYWxcclxuXHRcdHRoaXNcclxuXHJcblx0cmVjaXZlUHJvcHM6IChub2RlKSAtPlxyXG5cdFx0cHJvcHMgPSBBbmltYXRpb24ucHJvcHNcclxuXHRcdHByb3BzVXNlZCA9IEFuaW1hdGlvbi5wcm9wc1VzZWRcclxuXHRcdGZvciBuYW1lLCB1c2Ugb2YgcHJvcHNVc2VkXHJcblx0XHRcdGlmIHVzZVxyXG5cdFx0XHRcdG5vZGVbbmFtZV0gPSBwcm9wc1tuYW1lXVxyXG5cdFx0XHRcdGRlbGV0ZSBwcm9wc1VzZWRbbmFtZV1cclxuXHRcdHRoaXNcclxuXHJcblx0Y3JlYXRlV29ya0ZyYW1lOiAtPlxyXG5cdFx0QGxvb3AgPSBmYWxzZVxyXG5cdFx0QGZyYW1lID1cclxuXHRcdFx0d29yazogW1xyXG5cdFx0XHRcdHtcclxuXHRcdFx0XHRcdHN0YXJ0OiAwXHJcblx0XHRcdFx0XHRlbmQ6IDBcclxuXHRcdFx0XHRcdHRvOiB7fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XVxyXG5cdFx0dGhpc1xyXG5cclxuXHRyZXNldFdvcms6IC0+XHJcblx0XHRwcm9wc1VzZWQgPSBBbmltYXRpb24ucHJvcHNVc2VkXHJcblx0XHRmb3IgbmFtZSwgdXNlIG9mIHByb3BzVXNlZFxyXG5cdFx0XHRpZiB1c2UgdGhlbiBwcm9wc1VzZWRbbmFtZV0gPSBmYWxzZVxyXG5cdFx0dGhpc1xyXG5cclxuXHRjbGVhcldvcms6IC0+XHJcblx0XHRwcm9wc1VzZWQgPSBBbmltYXRpb24ucHJvcHNVc2VkXHJcblx0XHRhT2JqID0gQGZyYW1lLndvcmtbMF1cclxuXHRcdGFPYmouc3RhcnQgPSBhT2JqLmVuZCA9IDBcclxuXHRcdHRvID0gXHJcblx0XHRmb3IgbmFtZSwgXyBvZiB0b1xyXG5cdFx0XHRkZWxldGUgdG9bbmFtZV1cclxuXHRcdHRoaXNcclxuXHJcblx0YW5pbWF0ZVByb3BzOiAocHJvcHMsIGR1cmF0aW9uLCBmdW5jKSAtPlxyXG5cdFx0QGR1cmF0aW9uID0gZHVyYXRpb25cclxuXHRcdGFPYmogPSBAZnJhbWUud29ya1swXVxyXG5cdFx0YU9iai5lbmQgPSBkdXJhdGlvblxyXG5cdFx0YU9iai5mdW5jID0gZnVuY1xyXG5cdFx0dG8gPSBhT2JqLnRvXHJcblx0XHRmb3IgbmFtZSwgcHJvcCBvZiBwcm9wc1xyXG5cdFx0XHR0b1tuYW1lXSA9IHByb3BcclxuXHRcdEByZXNldCgpXHJcblx0XHR0aGlzXHJcblxyXG5leHBvcnQgeyBBbmltYXRpb25EYXRhLCBBbmltYXRpb24gfSIsImltcG9ydCB7IFNwcml0ZSB9IGZyb20gJy4vc3ByaXRlJ1xyXG5pbXBvcnQgeyBBbmltYXRpb24gfSBmcm9tICcuL2FuaW1hdGlvbidcclxuXHJcbmNsYXNzIE1vZGVsRGF0YVxyXG5cdEBjYWNoZTogW11cclxuXHJcblx0QGxvYWQ6IChsb2FkZXIsIGZpbGUpIC0+XHJcblx0XHRtb2RlbCA9IE1vZGVsRGF0YS5jYWNoZVtmaWxlXVxyXG5cdFx0dW5sZXNzIG1vZGVsXHJcblx0XHRcdG1vZGVsID0gbmV3IE1vZGVsRGF0YVxyXG5cdFx0XHRtb2RlbC5sb2FkIGxvYWRlciwgZmlsZVxyXG5cdFx0XHRNb2RlbERhdGEuY2FjaGVbZmlsZV0gPSBtb2RlbFxyXG5cdFx0bW9kZWxcclxuXHJcblx0bG9hZDogKGxvYWRlciwgZmlsZSkgLT5cclxuXHRcdGxvYWRlci5sb2FkSnNvbiBmaWxlLCAoZGF0YSkgPT5cclxuXHRcdFx0aWYgZGF0YVxyXG5cdFx0XHRcdGZvciBrZXksIHZhbHVlIG9mIGRhdGFcclxuXHRcdFx0XHRcdHRoaXNba2V5XSA9IHZhbHVlXHJcblxyXG5cdFx0XHRcdGlmIEBpbWFnZXNcclxuXHRcdFx0XHRcdGltYWdlc0RhdGEgPSBAaW1hZ2VzXHJcblx0XHRcdFx0XHRAaW1hZ2VzID0gW11cclxuXHRcdFx0XHRcdGZvciBrZXksIGltYWdlIG9mIGltYWdlc0RhdGFcclxuXHRcdFx0XHRcdFx0QGltYWdlc1trZXldID0gbG9hZGVyLmxvYWRJbWFnZSBpbWFnZVxyXG5cclxuXHRcdFx0XHRpZiBAc3ByaXRlc1xyXG5cdFx0XHRcdFx0c3ByaXRlc0RhdGEgPSBAc3ByaXRlc1xyXG5cdFx0XHRcdFx0QHNwcml0ZXMgPSBbXVxyXG5cdFx0XHRcdFx0Zm9yIGtleSwgc3ByaXRlIG9mIHNwcml0ZXNEYXRhXHJcblx0XHRcdFx0XHRcdEBzcHJpdGVzW2tleV0gPSBTcHJpdGUubG9hZCBsb2FkZXIsIHNwcml0ZVxyXG5cclxuXHRcdFx0XHRpZiBAbW9kZWxzXHJcblx0XHRcdFx0XHRtb2RlbHNEYXRhID0gQG1vZGVsc1xyXG5cdFx0XHRcdFx0QG1vZGVscyA9IFtdXHJcblx0XHRcdFx0XHRmb3Iga2V5LCBtb2RlbCBvZiBtb2RlbHNEYXRhXHJcblx0XHRcdFx0XHRcdEBtb2RlbHNba2V5XSA9IE1vZGVsRGF0YS5sb2FkIGxvYWRlciwgbW9kZWxcclxuXHJcblx0XHRcdFx0bm9kZXNMb2FkID0gKG5vZGVzLCBub2RlUGF0aCA9ICcnKSAtPlxyXG5cdFx0XHRcdFx0Zm9yIG5hbWUsIG5vZGUgb2Ygbm9kZXNcclxuXHRcdFx0XHRcdFx0bm9kZS5ub2RlUGF0aCA9IG5vZGVQYXRoICsgbmFtZVxyXG5cdFx0XHRcdFx0XHRub2RlLm5vZGVOYW1lID0gJ0AnICsgbmFtZVxyXG5cdFx0XHRcdFx0XHRpZiBub2RlLmJlZm9yZVxyXG5cdFx0XHRcdFx0XHRcdG5vZGVzTG9hZCBub2RlLmJlZm9yZSwgbm9kZS5ub2RlUGF0aCArICc8J1xyXG5cdFx0XHRcdFx0XHRpZiBub2RlLmFmdGVyXHJcblx0XHRcdFx0XHRcdFx0bm9kZXNMb2FkIG5vZGUuYWZ0ZXIsIG5vZGUubm9kZVBhdGggKyAnPidcclxuXHJcblx0XHRcdFx0aWYgQGJvbmVzXHJcblx0XHRcdFx0XHRub2Rlc0xvYWQgQGJvbmVzXHJcblxyXG5cclxuZHJhd1R5cGVPYmogPVxyXG5cdGxpbmU6IChnKSAtPlxyXG5cdFx0Zy5tb3ZlVG8gQHgxIHx8IDAsIEB5MSB8fCAwXHJcblx0XHRnLmxpbmVUbyBAeDIgfHwgMCwgQHkyIHx8IDBcclxuXHRcdHRoaXNcclxuXHJcblx0cmVjdDogKGcpIC0+XHJcblx0XHRnLnJlY3QgQHggfHwgMCwgQHkgfHwgMCwgQHdpZHRoIHx8IDEsIEBoZWlnaHQgfHwgMVxyXG5cdFx0dGhpc1xyXG5cclxuXHRyZWN0Um91bmQ6IChnKSAtPlxyXG5cdFx0QG5vQ2xvc2UgPSBmYWxzZVxyXG5cdFx0eCA9IEB4IHx8IDBcclxuXHRcdHkgPSBAeSB8fCAwXHJcblx0XHR3ID0gQHdpZHRoXHJcblx0XHRoID0gQGhlaWdodFxyXG5cdFx0ciA9IEByYWRpdXNcclxuXHRcdGlmIHcgPCAyICogciB0aGVuIHIgPSB3IC8gMlxyXG5cdFx0aWYgaCA8IDIgKiByIHRoZW4gciA9IGggLyAyXHJcblxyXG5cdFx0Zy5tb3ZlVG8geCArIHIsIHlcclxuXHRcdGcuYXJjVG8gIHggKyB3LCB5LCAgICAgeCArIHcsIHkgKyBoLCByXHJcblx0XHRnLmFyY1RvICB4ICsgdywgeSArIGgsIHgsICAgICB5ICsgaCwgclxyXG5cdFx0Zy5hcmNUbyAgeCwgICAgIHkgKyBoLCB4LCAgICAgeSwgICAgIHJcclxuXHRcdGcuYXJjVG8gIHgsICAgICB5LCAgICAgeCArIHcsIHksICAgICByXHJcblx0XHR0aGlzXHJcblxyXG5cdGFyYzogKGcpIC0+XHJcblx0XHRnLmFyYyhcclxuXHRcdFx0QHggfHwgMCxcclxuXHRcdFx0QHkgfHwgMCxcclxuXHRcdFx0QHJhZGl1cyxcclxuXHRcdFx0KEBzdGFydEFuZ2xlIHx8IDApICogTWF0aC5QSSAvIDE4MCxcclxuXHRcdFx0KEBlbmRBbmdsZSB8fCAzNjApICogTWF0aC5QSSAvIDE4MCxcclxuXHRcdFx0aWYgQGNsb2Nrd2lzZSB0aGVuIGZhbHNlIGVsc2UgdHJ1ZSlcclxuXHRcdHRoaXNcclxuXHJcblx0ZWxpcHNlOiAoZykgLT5cclxuXHRcdGcuZWxsaXBzZShcclxuXHRcdFx0QHggfHwgMCxcclxuXHRcdFx0QHkgfHwgMCxcclxuXHRcdFx0QHJ4LFxyXG5cdFx0XHRAcnksXHJcblx0XHRcdChAcm90YXRpb24gfHwgMCkgKiBNYXRoLlBJIC8gMTgwLFxyXG5cdFx0XHQoQHN0YXJ0QW5nbGUgfHwgMCkgKiBNYXRoLlBJIC8gMTgwLFxyXG5cdFx0XHQoQGVuZEFuZ2xlIHx8IDM2MCkgKiBNYXRoLlBJIC8gMTgwLFxyXG5cdFx0XHRpZiBAY2xvY2t3aXNlIHRoZW4gZmFsc2UgZWxzZSB0cnVlKVxyXG5cdFx0dGhpc1xyXG5cclxuXHRwYXRoOiAoZykgLT5cclxuXHRcdHggPSBAeCB8fCAwXHJcblx0XHR5ID0gQHkgfHwgMFxyXG5cdFx0aWYgdHlwZW9mIEBwYXRoID09ICdzdHJpbmcnXHJcblx0XHRcdEBwYXRoID0gbmV3IFBhdGgyRCBAcGF0aFxyXG5cdFx0I1xyXG5cdFx0QG5vQ2xvc2UgPSB0cnVlXHJcblx0XHRnLnRyYW5zbGF0ZSB4LCB5XHJcblx0XHRkcmF3ID0gQGRyYXcgfHwgJ2YmcydcclxuXHRcdGlmIGRyYXcgPT0gJ2YnIHx8IGRyYXcgPT0gJ2YmcydcclxuXHRcdFx0Zy5maWxsIEBwYXRoXHJcblx0XHRpZiBkcmF3ID09ICdzJyB8fCBkcmF3ID09ICdmJnMnXHJcblx0XHRcdGcuc3Ryb2tlIEBwYXRoXHJcblx0XHR0aGlzXHJcblxyXG5cdG5vZGU6IChnLCBtb2RlbCwgb3BhY2l0eSwgZGF0YSkgLT5cclxuXHRcdEBub0Nsb3NlID0gQGRyYXcgPSB0cnVlXHJcblx0XHQjIFNhdmUgY3VycmVudCBtb2RlbCBkYXRhXHJcblx0XHR0RGF0YSA9IG1vZGVsLmRhdGFcclxuXHRcdCMgU2VsZWN0IG1vZGVsXHJcblx0XHRkYXRhID0gZGF0YSB8fCB0RGF0YS5tb2RlbHM/W0Btb2RlbF1cclxuXHRcdGlmIGRhdGFcclxuXHRcdFx0bW9kZWwuZGF0YSA9IGRhdGFcclxuXHRcdFx0bm9kZXMgPSBkYXRhLmJvbmVzXHJcblx0XHRlbHNlXHJcblx0XHRcdG5vZGVzID0gbW9kZWwuZGF0YS5ib25lc1xyXG5cdFx0aWYgbm9kZXNcclxuXHRcdFx0IyBTZWxlY3Qgbm9kZSBpbiBtb2RlbFxyXG5cdFx0XHRub2RlID0gQG5vZGVcclxuXHRcdFx0aWYgdHlwZW9mIG5vZGUgPT0gJ3N0cmluZydcclxuXHRcdFx0XHRub2RlID0gbm9kZXNbbm9kZV1cclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdHJvb3QgPSBub2Rlc1xyXG5cdFx0XHRcdGZvciBwYXRoIGluIG5vZGVcclxuXHRcdFx0XHRcdHJvb3QgPSByb290W3BhdGhdXHJcblx0XHRcdFx0bm9kZSA9IHJvb3RcclxuXHRcdFx0aWYgbm9kZVxyXG5cdFx0XHRcdGcudHJhbnNsYXRlIEB4IHx8IDAsIEB5IHx8IDBcclxuXHRcdFx0XHRkcmF3Tm9kZS5jYWxsIG5vZGUsIGcsIG1vZGVsLCBvcGFjaXR5XHJcblx0XHRcdFx0IyBSZWNpdmUgbW9kZWwgZGF0YVxyXG5cdFx0bW9kZWwuZGF0YSA9IHREYXRhXHJcblx0XHR0aGlzXHJcblxyXG5cdGF0dGFjaDogKGcsIG1vZGVsLCBvcGFjaXR5KSAtPlxyXG5cdFx0ZGF0YSA9IG1vZGVsLmF0dGFjaG1lbnRbQGF0dGFjaF1cclxuXHRcdGlmIGRhdGFcclxuXHRcdFx0ZHJhd1R5cGVPYmoubm9kZS5jYWxsIHRoaXMsIGcsIG1vZGVsLCBvcGFjaXR5LCBkYXRhXHJcblx0XHR0aGlzXHJcblxyXG5cdGltYWdlOiAoZywgbW9kZWwpIC0+XHJcblx0XHRAbm9DbG9zZSA9IEBkcmF3ID0gdHJ1ZVxyXG5cdFx0aW1hZ2UgPSBtb2RlbC5kYXRhLmltYWdlc1tAaW1hZ2VdXHJcblx0XHRpZiBAd2lkdGggfHwgQGhlaWdodFxyXG5cdFx0XHRnLmRyYXdJbWFnZSBpbWFnZSwgQHggfHwgMCwgQHkgfHwgMCwgQHdpZHRoLCBAaGVpZ2h0XHJcblx0XHRlbHNlXHJcblx0XHRcdGcuZHJhd0ltYWdlIGltYWdlLCBAeCB8fCAwLCBAeSB8fCAwXHJcblx0XHR0aGlzXHJcblxyXG5cdHNwcml0ZTogKGcsIG1vZGVsKSAtPlxyXG5cdFx0QG5vQ2xvc2UgPSBAZHJhdyA9IHRydWVcclxuXHRcdHNwcml0ZSA9IEBzcHJpdGVcclxuXHRcdGlmIHNwcml0ZS5jb25zdHJ1Y3RvciA9PSBTdHJpbmdcclxuXHRcdFx0QHNwcml0ZSA9IHNwcml0ZSA9IG1vZGVsLmRhdGEuc3ByaXRlc1tzcHJpdGVdXHJcblx0XHRzcHJpdGUuZHJhdyBnLCBAZnJhbWUsIEB4IHx8IDAsIEB5IHx8IDAsIEBpbmRleFxyXG5cdFx0dGhpc1xyXG5cclxuXHR0ZXh0OiAoZykgLT5cclxuXHRcdGlmIEBkcmF3ICE9IHRydWVcclxuXHRcdFx0QGRyYXdUZXh0ID0gQGRyYXdcclxuXHRcdGRyYXcgPSBAZHJhd1RleHRcclxuXHRcdEBub0Nsb3NlID0gQGRyYXcgPSB0cnVlXHJcblx0XHQjXHJcblx0XHRpZiBAZm9udCB0aGVuIGcuZm9udCA9IEBmb250XHJcblx0XHRpZiBAdGV4dEFsaWduIHRoZW4gZy50ZXh0QWxpZ24gPSBAdGV4dEFsaWduXHJcblx0XHRpZiBAdGV4dEJhc2VsaW5lICE9IG51bGwgdGhlbiBnLnRleHRCYXNlbGluZSA9IEB0ZXh0QmFzZWxpbmVcclxuXHRcdGlmIEBkaXJlY3Rpb24gdGhlbiBnLmRpcmVjdGlvbiA9IEBkaXJlY3Rpb25cclxuXHRcdCNcclxuXHRcdGlmIGRyYXcgPT0gJ2YnIHx8IGRyYXcgPT0gJ2YmcydcclxuXHRcdFx0Zy5maWxsVGV4dCBAdGV4dCwgQHggfHwgMCwgQHkgfHwgMCwgQG1heFdpZHRoXHJcblx0XHRpZiBkcmF3ID09ICdzJyB8fCBkcmF3ID09ICdmJnMnXHJcblx0XHRcdGcuc3Ryb2tlVGV4dCBAdGV4dCwgQHggfHwgMCwgQHkgfHwgMCwgQG1heFdpZHRoXHJcblx0XHR0aGlzXHJcblxyXG5zdHlsZVR5cGVGdW5jID1cclxuXHRsaW5lYXI6IChnKSAtPlxyXG5cdFx0Z3JhZGllbnQgPSBnLmNyZWF0ZUxpbmVhckdyYWRpZW50IEB4MCB8fCAwLCBAeTAgfHwgMCwgQHgxIHx8IDAsIEB5MSB8fCAwXHJcblx0XHRmb3IgY29sb3JTdG9wIGluIEBjb2xvclN0b3BzXHJcblx0XHRcdGdyYWRpZW50LmFkZENvbG9yU3RvcCBjb2xvclN0b3AucG9zIHx8IDAsIGNvbG9yU3RvcC5jb2xvclxyXG5cdFx0Z3JhZGllbnRcclxuXHJcblx0cmFkaWFsOiAoZykgLT5cclxuXHRcdGdyYWRpZW50ID0gZy5jcmVhdGVSYWRpYWxHcmFkaWVudCBAeDAgfHwgMCwgQHkwIHx8IDAsIEByMCB8fCAwLCBAeDEgfHwgMCwgQHkxIHx8IDAsIEByMSB8fCAwXHJcblx0XHRmb3IgY29sb3JTdG9wIGluIEBjb2xvclN0b3BzXHJcblx0XHRcdGdyYWRpZW50LmFkZENvbG9yU3RvcCBjb2xvclN0b3AucG9zIHx8IDAsIGNvbG9yU3RvcC5jb2xvclxyXG5cdFx0Z3JhZGllbnRcclxuXHJcblx0cGF0dGVybjogKGcsIG1vZGVsKSAtPlxyXG5cdFx0aW1hZ2UgPSBtb2RlbC5kYXRhLmltYWdlc1tAaW1hZ2VdXHJcblx0XHRnLmNyZWF0ZVBhdHRlcm4gaW1hZ2UsIEByZXBldGl0aW9uIHx8IFwicmVwZWF0XCJcclxuXHJcbmluaXRTdHlsZSA9IChnLCBtb2RlbCwgc3R5bGUpIC0+XHJcblx0c3R5bGVUeXBlRnVuY1tzdHlsZS50eXBlXT8uY2FsbCBzdHlsZSwgZywgbW9kZWxcclxuXHJcbnNldERyYXdTdHlsZSA9IChnLCBtb2RlbCkgLT5cclxuXHRzdHJva2UgPSBAc3Ryb2tlXHJcblx0aWYgc3Ryb2tlXHJcblx0XHRpZiBzdHJva2UuY29uc3RydWN0b3IgPT0gT2JqZWN0XHJcblx0XHRcdEBzdHJva2UgPSBpbml0U3R5bGUgZywgbW9kZWwsIHN0cm9rZVxyXG5cdFx0Zy5zdHJva2VTdHlsZSA9IEBzdHJva2VcclxuXHRmaWxsID0gQGZpbGxcclxuXHRpZiBmaWxsXHJcblx0XHRpZiBmaWxsLmNvbnN0cnVjdG9yID09IE9iamVjdFxyXG5cdFx0XHRAZmlsbCA9IGluaXRTdHlsZSBnLCBtb2RlbCwgZmlsbFxyXG5cdFx0Zy5maWxsU3R5bGUgPSBAZmlsbFxyXG5cdGlmIEBsaW5lV2lkdGggIT0gbnVsbCB0aGVuIGcubGluZVdpZHRoID0gQGxpbmVXaWR0aFxyXG5cdGlmIEBsaW5lQ2FwICE9IG51bGwgdGhlbiBnLmxpbmVDYXAgPSBAbGluZUNhcFxyXG5cdGlmIEBsaW5lSm9pbiB0aGVuIGcubGluZUpvaW4gPSBAbGluZUpvaW5cclxuXHRpZiBAbGluZURhc2hPZmZzZXQgIT0gbnVsbCB0aGVuIGcubGluZURhc2hPZmZzZXQgPSBAbGluZURhc2hPZmZzZXRcclxuXHR0aGlzXHJcblxyXG5kcmF3Tm9kZSA9IChnLCBtb2RlbCwgb3BhY2l0eSkgLT5cclxuXHRnLnNhdmUoKVxyXG5cdG1vZGVsLmFuaW1hdGlvbi5hbmltYXRlIHRoaXNcclxuXHRnLnRyYW5zZm9ybSBAc2NhbGVYIHx8IDEsIEBza2V3WSB8fCAwLCBAc2tld1ggfHwgMCwgQHNjYWxlWSB8fCAxLCBAb3JpZ1ggfHwgMCwgQG9yaWdZIHx8IDBcclxuXHRpZiBAYW5nbGUgdGhlbiBnLnJvdGF0ZSBAYW5nbGUgKiBNYXRoLlBJIC8gMTgwXHJcblx0c2V0RHJhd1N0eWxlLmNhbGwgdGhpcywgZywgbW9kZWxcclxuXHQjIFNoYWRvd3NcclxuXHRpZiBAbm9TaGFkb3dcclxuXHRcdGcuc2hhZG93Qmx1ciA9IDBcclxuXHRcdGcuc2hhZG93T2Zmc2V0WCA9IDBcclxuXHRcdGcuc2hhZG93T2Zmc2V0WSA9IDBcclxuXHRpZiBAc2hhZG93Qmx1ciAhPSBudWxsIHRoZW4gZy5zaGFkb3dCbHVyID0gQHNoYWRvd0JsdXJcclxuXHRpZiBAc2hhZG93Q29sb3IgIT0gbnVsbCB0aGVuIGcuc2hhZG93Q29sb3IgPSBAc2hhZG93Q29sb3JcclxuXHRpZiBAc2hhZG93T2Zmc2V0WCAhPSBudWxsIHRoZW4gZy5zaGFkb3dPZmZzZXRYID0gQHNoYWRvd09mZnNldFhcclxuXHRpZiBAc2hhZG93T2Zmc2V0WSAhPSBudWxsIHRoZW4gZy5zaGFkb3dPZmZzZXRZID0gQHNoYWRvd09mZnNldFlcclxuXHRnLmdsb2JhbEFscGhhID0gb3BhY2l0eSAqIChpZiBAb3BhY2l0eSA9PSBudWxsIHRoZW4gMSBlbHNlIEBvcGFjaXR5KVxyXG5cclxuXHRpZiBAYmVmb3JlXHJcblx0XHRtb2RlbC5hbmltYXRpb24ucmVjaXZlUHJvcHMgdGhpc1xyXG5cdFx0I1xyXG5cdFx0Zm9yIGtleSwgbm9kZSBvZiBAYmVmb3JlXHJcblx0XHRcdGlmICFub2RlLmhpZGVcclxuXHRcdFx0XHRkcmF3Tm9kZS5jYWxsIG5vZGUsIGcsIG1vZGVsLCBvcGFjaXR5XHJcblx0XHQjXHJcblx0XHRtb2RlbC5hbmltYXRpb24uYW5pbWF0ZSB0aGlzXHJcblxyXG5cdGcuYmVnaW5QYXRoKClcclxuXHRkcmF3VHlwZU9ialtAdHlwZV0/LmNhbGwgdGhpcywgZywgbW9kZWwsIG9wYWNpdHlcclxuXHRpZiAhQG5vQ2xvc2UgdGhlbiBnLmNsb3NlUGF0aCgpXHJcblxyXG5cdGRyYXcgPSBAZHJhdyB8fCAnZiZzJ1xyXG5cdGlmIGRyYXcgPT0gJ2YnIHx8IGRyYXcgPT0gJ2YmcydcclxuXHRcdGcuZmlsbCgpXHJcblx0aWYgZHJhdyA9PSAncycgfHwgZHJhdyA9PSAnZiZzJ1xyXG5cdFx0Zy5zdHJva2UoKVxyXG5cclxuXHRpZiBAY2xpcFxyXG5cdFx0Zy5jbGlwKClcclxuXHJcblx0bW9kZWwuYW5pbWF0aW9uLnJlY2l2ZVByb3BzIHRoaXNcclxuXHJcblx0aWYgQGFmdGVyXHJcblx0XHRmb3Iga2V5LCBub2RlIG9mIEBhZnRlclxyXG5cdFx0XHRpZiAhbm9kZS5oaWRlXHJcblx0XHRcdFx0ZHJhd05vZGUuY2FsbCBub2RlLCBnLCBtb2RlbCwgb3BhY2l0eVxyXG5cclxuXHRpZiBNb2RlbC5kcmF3T3JpZ2luXHJcblx0XHRnLmZpbGxTdHlsZSA9ICcjZjAwJ1xyXG5cdFx0Zy5zaGFkb3dCbHVyID0gMFxyXG5cdFx0Zy5zaGFkb3dPZmZzZXRYID0gMFxyXG5cdFx0Zy5zaGFkb3dPZmZzZXRZID0gMFxyXG5cdFx0Zy5maWxsUmVjdCAtMiwgLTIsIDQsIDRcclxuXHJcblx0Zy5yZXN0b3JlKClcclxuXHR0aGlzXHJcblxyXG5cclxuZHJhd1BhcnRUeXBlID1cclxuXHRwb2x5OiAoZywgdmVydHMsIGNhbWVyYSwgbW9kZWwpIC0+XHJcblx0XHR2ID0gdmVydHNbQHZlcnRzWzBdXVxyXG5cdFx0eGMgPSBjYW1lcmEueFxyXG5cdFx0eWMgPSBjYW1lcmEueVxyXG5cdFx0enQgPSBaX09SSUdJTiArIGNhbWVyYS56XHJcblx0XHR6ID0gKCh2LnogfHwgMCkgKyB6dCkgKiBaX1RSQU5TRk9STVxyXG5cdFx0eCA9ICgodi54IHx8IDApICsgeGMpICogelxyXG5cdFx0eSA9ICgodi55IHx8IDApICsgeWMpICogelxyXG5cdFx0Zy5tb3ZlVG8geCwgeVxyXG5cdFx0bCA9IEB2ZXJ0cy5sZW5ndGggLSAxXHJcblx0XHRmb3IgaSBpbiBbMS4ubF1cclxuXHRcdFx0diA9IHZlcnRzW0B2ZXJ0c1tpXV07XHJcblx0XHRcdHogPSAoKHYueiB8fCAwKSArIHp0KSAqIFpfVFJBTlNGT1JNXHJcblx0XHRcdHggPSAoKHYueCB8fCAwKSArIHhjKSAqIHpcclxuXHRcdFx0eSA9ICgodi55IHx8IDApICsgeWMpICogelxyXG5cdFx0XHRnLmxpbmVUbyB4LCB5XHJcblx0XHR0aGlzXHJcblxyXG5cdHBhcnQ6IChnLCB2ZXJ0cywgY2FtZXJhLCBtb2RlbCwgb3BhY2l0eSkgLT5cclxuXHRcdEBub0Nsb3NlID0gQGRyYXcgPSB0cnVlXHJcblx0XHQjIFNhdmUgbW9kZWwgZGF0YVxyXG5cdFx0dERhdGEgPSBtb2RlbC5kYXRhXHJcblx0XHQjIFNlbGVjdCBtb2RlbFxyXG5cdFx0ZGF0YSA9IHREYXRhLm1vZGVscz9bQG1vZGVsXVxyXG5cdFx0aWYgZGF0YVxyXG5cdFx0XHRtb2RlbC5kYXRhID0gZGF0YVxyXG5cdFx0XHRwYXJ0cyA9IGRhdGEucGFydHNcclxuXHRcdGVsc2VcclxuXHRcdFx0cGFydHMgPSBtb2RlbC5kYXRhLnBhcnRzXHJcblx0XHRpZiBwYXJ0c1xyXG5cdFx0XHR2ID0gdmVydHNbQHZlcnRdXHJcblx0XHRcdGMgPVxyXG5cdFx0XHRcdHg6IGNhbWVyYS54ICsgKHYueCB8fCAwKVxyXG5cdFx0XHRcdHk6IGNhbWVyYS55ICsgKHYueSB8fCAwKVxyXG5cdFx0XHRcdHo6IGNhbWVyYS56ICsgKHYueiB8fCAwKVxyXG5cclxuXHRcdFx0cGFydCA9IHBhcnRzW0BwYXJ0XVxyXG5cdFx0XHRpZiBwYXJ0XHJcblx0XHRcdFx0dFBhcnRzID0gbW9kZWwucGFydHNcclxuXHRcdFx0XHRtb2RlbC5wYXJ0cyA9IHBhcnRzXHJcblx0XHRcdFx0Zm9yIGZhY2UgaW4gcGFydC5mYWNlc1xyXG5cdFx0XHRcdFx0ZHJhd1BhcnQuY2FsbCBmYWNlLCBnLCBtb2RlbCwgYywgb3BhY2l0eVxyXG5cdFx0XHRcdG1vZGVsLnBhcnRzID0gdFBhcnRzXHJcblx0XHRtb2RlbC5kYXRhID0gdERhdGFcclxuXHRcdHRoaXNcclxuXHJcblx0bm9kZTogKGcsIHZlcnRzLCBjYW1lcmEsIG1vZGVsLCBvcGFjaXR5KSAtPlxyXG5cdFx0dHJhbnNmb3JtVmVydCB2ZXJ0c1tAdmVydF0sIGNhbWVyYVxyXG5cdFx0XHQuYXBwbHkgZ1xyXG5cdFx0ZHJhd1R5cGVPYmoubm9kZS5jYWxsIHRoaXMsIGcsIG1vZGVsLCBvcGFjaXR5XHJcblx0XHR0aGlzXHJcblxyXG5cdGF0dGFjaDogKGcsIG1vZGVsLCBvcGFjaXR5KSAtPlxyXG5cdFx0dHJhbnNmb3JtVmVydCB2ZXJ0c1tAdmVydF0sIGNhbWVyYVxyXG5cdFx0XHQuYXBwbHkgZ1xyXG5cdFx0ZGF0YSA9IG1vZGVsLmF0dGFjaG1lbnRbQGF0dGFjaF1cclxuXHRcdGlmIGRhdGFcclxuXHRcdFx0ZHJhd1R5cGVPYmoubm9kZS5jYWxsIHRoaXMsIGcsIG1vZGVsLCBvcGFjaXR5LCBkYXRhXHJcblx0XHR0aGlzXHJcblxyXG5cdGVsaXBzZTogKGcsIHZlcnRzLCBjYW1lcmEpIC0+XHJcblx0XHR2ID0gdHJhbnNmb3JtVmVydCB2ZXJ0c1tAdmVydDFdLCBjYW1lcmFcclxuXHRcdHgxID0gdi54XHJcblx0XHR5MSA9IHYueVxyXG5cdFx0diA9IHRyYW5zZm9ybVZlcnQgdmVydHNbQHZlcnQyXSwgY2FtZXJhXHJcblx0XHR4MiA9IHYueFxyXG5cdFx0eTIgPSB2LnlcclxuXHRcdHJ4ID0gKHgyIC0geDEpIC8gMlxyXG5cdFx0cnkgPSAoeTIgLSB5MSkgLyAyXHJcblx0XHRnLmVsbGlwc2UoXHJcblx0XHRcdHgxICsgcngsXHJcblx0XHRcdHkxICsgcnksXHJcblx0XHRcdHJ4LFxyXG5cdFx0XHRyeSxcclxuXHRcdFx0KEByb3RhdGlvbiB8fCAwKSAqIE1hdGguUEkgLyAxODAsXHJcblx0XHRcdChAc3RhcnRBbmdsZSB8fCAwKSAqIE1hdGguUEkgLyAxODAsXHJcblx0XHRcdChAZW5kQW5nbGUgfHwgMzYwKSAqIE1hdGguUEkgLyAxODAsXHJcblx0XHRcdGlmIEBjbG9ja3dpc2UgdGhlbiBmYWxzZSBlbHNlIHRydWUpXHJcblx0XHR0aGlzXHJcblxyXG5cclxuZHJhd1BhcnQgPSAoZywgbW9kZWwsIGNhbWVyYSwgb3BhY2l0eSkgLT5cclxuXHRnLnNhdmUoKVxyXG5cdHN0cm9rZSA9IEBzdHJva2VcclxuXHRzZXREcmF3U3R5bGUuY2FsbCB0aGlzLCBnLCBtb2RlbFxyXG5cdGcuZ2xvYmFsQWxwaGEgPSBvcGFjaXR5ICogKGlmIEBvcGFjaXR5ID09IG51bGwgdGhlbiAxIGVsc2UgQG9wYWNpdHkpXHJcblxyXG5cdGcuYmVnaW5QYXRoKClcclxuXHRkcmF3UGFydFR5cGVbQHR5cGUgfHwgJ3BvbHknXT8uY2FsbCB0aGlzLCBnLCBtb2RlbC5kYXRhLnZlcnRzLCBjYW1lcmEsIG1vZGVsLCBvcGFjaXR5XHJcblx0aWYgIUBub0Nsb3NlIHRoZW4gZy5jbG9zZVBhdGgoKVxyXG5cclxuXHRkcmF3ID0gQGRyYXcgfHwgJ2YmcydcclxuXHRpZiBkcmF3ID09ICdmJyB8fCBkcmF3ID09ICdmJnMnXHJcblx0XHRnLmZpbGwoKVxyXG5cdGlmIGRyYXcgPT0gJ3MnIHx8IGRyYXcgPT0gJ2YmcydcclxuXHRcdGcuc3Ryb2tlKClcclxuXHJcblx0Zy5yZXN0b3JlKClcclxuXHR0aGlzXHJcblxyXG5aX1RSQU5TRk9STSA9IDAuMDAwMlxyXG5aX09SSUdJTiA9IDEgLyBaX1RSQU5TRk9STVxyXG5cclxudHJzZk9iaiA9XHJcblx0eDogMFxyXG5cdHk6IDBcclxuXHRzY2FsZTogMVxyXG5cdGFwcGx5OiAoZykgLT5cclxuXHRcdGcudHJhbnNmb3JtIEBzY2FsZSwgMCwgMCwgQHNjYWxlLCBAeCwgQHlcclxuXHJcblxyXG5jbGFzcyBNb2RlbFxyXG5cdEB0cmFuc2Zvcm06ICh4LCB5LCB6LCBjYW1lcmEpIC0+XHJcblx0XHR6ID0gKFpfT1JJR0lOICsgeiArIGNhbWVyYS56KSAqIFpfVFJBTlNGT1JNXHJcblx0XHR0cnNmT2JqLnggPSAoeCArIGNhbWVyYS54KSAqIHpcclxuXHRcdHRyc2ZPYmoueSA9ICh5ICsgY2FtZXJhLnkpICogelxyXG5cdFx0dHJzZk9iai5zY2FsZSA9IHpcclxuXHRcdHRyc2ZPYmpcclxuXHJcblx0Y29uc3RydWN0b3I6IChAZGF0YSkgLT5cclxuXHRcdEBhdHRhY2htZW50ID0gW11cclxuXHRcdEBhbmltYXRpb24gPSBuZXcgQW5pbWF0aW9uXHJcblxyXG5cdHNldERhdGE6IChAZGF0YSkgLT5cclxuXHJcblx0ZHJhdzJEOiAoZywgb3BhY2l0eSA9IDEpIC0+XHJcblx0XHRpZiBib25lcyA9IEBkYXRhPy5ib25lc1xyXG5cdFx0XHRmb3Iga2V5LCBub2RlIG9mIGJvbmVzXHJcblx0XHRcdFx0aWYgIW5vZGUuaGlkZVxyXG5cdFx0XHRcdFx0ZHJhd05vZGUuY2FsbCBub2RlLCBnLCB0aGlzLCBvcGFjaXR5XHJcblxyXG5cdGRyYXdOb2RlOiAoZywgbm9kZSwgb3BhY2l0eSA9IDEpIC0+XHJcblx0XHRpZiBib25lcyA9IEBkYXRhPy5ib25lc1xyXG5cdFx0XHRub2RlID0gYm9uZXNbbm9kZV1cclxuXHRcdFx0aWYgbm9kZVxyXG5cdFx0XHRcdGRyYXdOb2RlLmNhbGwgbm9kZSwgZywgdGhpcywgb3BhY2l0eVxyXG5cclxuXHRkcmF3UGFydDogKGcsIHBhcnQsIGNhbWVyYSwgb3BhY2l0eSA9IDEpIC0+XHJcblx0XHRmb3IgZmFjZSBpbiBwYXJ0LmZhY2VzXHJcblx0XHRcdGRyYXdQYXJ0LmNhbGwgZmFjZSwgZywgdGhpcywgY2FtZXJhLCBvcGFjaXR5XHJcblxyXG5cdGRyYXdQYXJ0czogKGcsIGNhbWVyYSwgb3BhY2l0eSA9IDEpIC0+XHJcblx0XHRpZiBwYXJ0cyA9IEBkYXRhPy5wYXJ0c1xyXG5cdFx0XHRmb3IgXywgcGFydCBvZiBwYXJ0c1xyXG5cdFx0XHRcdGlmICFwYXJ0LmhpZGVcclxuXHRcdFx0XHRcdGZvciBmYWNlIGluIHBhcnQuZmFjZXNcclxuXHRcdFx0XHRcdFx0ZHJhd1BhcnQuY2FsbCBmYWNlLCBnLCB0aGlzLCBjYW1lcmEsIG9wYWNpdHlcclxuXHJcbnRyYW5zZm9ybSA9IE1vZGVsLnRyYW5zZm9ybVxyXG5cclxudHJhbnNmb3JtVmVydCA9ICh2LCBjYW1lcmEpIC0+XHJcblx0dHJhbnNmb3JtIHYueCB8fCAwLCB2LnkgfHwgMCwgdi56IHx8IDAsIGNhbWVyYVxyXG5cclxuZXhwb3J0IHsgTW9kZWxEYXRhLCBNb2RlbCB9IiwiY2xhc3MgRXZlbnRFbW1pdGVyXHJcblx0aGFuZGxlcnM6IFtdXHJcblxyXG5cdG9uOiAoZXZlbnQsIGNhbGxiYWNrKSAtPlxyXG5cdFx0aWYgY2FsbGJhY2tcclxuXHRcdFx0aGFuZGxlciA9IEBoYW5kbGVyc1tldmVudF1cclxuXHRcdFx0aWYgIWhhbmRsZXJcclxuXHRcdFx0XHRAaGFuZGxlcnNbZXZlbnRdID0gaGFuZGxlciA9IFtdXHJcblx0XHRcdGlmIGhhbmRsZXIuaW5kZXhPZihjYWxsYmFjaykgPCAwXHJcblx0XHRcdFx0aGFuZGxlci5wdXNoIGNhbGxiYWNrXHJcblx0XHR0aGlzXHJcblxyXG5cdG9mZjogKGV2ZW50LCBjYWxsYmFjaykgLT5cclxuXHRcdGlmIGNhbGxiYWNrXHJcblx0XHRcdGhhbmRsZXIgPSBAaGFuZGxlcnNbZXZlbnRdXHJcblx0XHRcdGlmIGhhbmRsZXJcclxuXHRcdFx0XHRpbmRleCA9IGhhbmRsZXIuaW5kZXhPZiBjYWxsYmFja1xyXG5cdFx0XHRcdGlmIGluZGV4ID49IDBcclxuXHRcdFx0XHRcdGhhbmRsZXIuc3BsaWNlIGluZGV4LCAxXHJcblx0XHR0aGlzXHJcblxyXG5cdHRyaWdnZXI6IChldmVudCwgYXJncykgLT5cclxuXHRcdGhhbmRsZXIgPSBAaGFuZGxlcnNbZXZlbnRdXHJcblx0XHRpZiBoYW5kbGVyXHJcblx0XHRcdGZvciBjYWxsYmFjayBpbiBoYW5kbGVyXHJcblx0XHRcdFx0Y2FsbGJhY2suYXBwbHkgdGhpcywgYXJnc1xyXG5cdFx0dGhpc1xyXG5cclxuXHRyZW1vdmVFdmVudDogKGV2ZW50KSAtPlxyXG5cdFx0ZGVsZXRlIEBoYW5kbGVyc1tldmVudF1cclxuXHRcdHRoaXNcclxuXHJcbmV4cG9ydCB7IEV2ZW50RW1taXRlciB9IiwiaW1wb3J0IHsgRXZlbnRFbW1pdGVyIH0gZnJvbSAnLi9ldmVudHMnXHJcblxyXG4jIEV2ZW50czpcclxuIyAnY2hhbmdlcGVyY2VudCcgdHJpZ2dlciB3aGVuIHNvbWUgcmVzb3JjZXMgbG9hZGVkXHJcbiMgJ2xvYWQnIHRyaWdnZXIgd2hlbiBhbGwgcmVzb3JjZXMgbG9hZGVkXHJcblxyXG5jbGFzcyBMb2FkZXIgZXh0ZW5kcyBFdmVudEVtbWl0ZXJcclxuXHRsb2FkUmVzTnVtYmVyID0gMFxyXG5cdGFsbFJlc0xvYWRlciA9IDBcclxuXHJcblx0cmVzZXQ6ICgpIC0+XHJcblx0XHRsb2FkUmVzTnVtYmVyID0gYWxsUmVzTG9hZGVyID0gMFxyXG5cclxuXHRnZXRQZXJjZW50OiAtPlxyXG5cdFx0MSAtIGlmIGFsbFJlc0xvYWRlciAhPSAwIHRoZW4gbG9hZFJlc051bWJlciAvIGFsbFJlc0xvYWRlciBlbHNlIDBcclxuXHJcblx0dXBkYXRlUGVyY2VudDogKCkgLT5cclxuXHRcdEB0cmlnZ2VyICdjaGFuZ2VwZXJjZW50JywgWyBAZ2V0UGVyY2VudCgpIF1cclxuXHJcblx0bG9hZDogKGNhbGxiYWNrKSAtPlxyXG5cdFx0X3RoaXMgPSB0aGlzXHJcblx0XHRsb2FkUmVzTnVtYmVyKytcclxuXHRcdGFsbFJlc0xvYWRlcisrXHJcblx0XHQjIEB1cGRhdGVQZXJjZW50KClcclxuXHRcdC0+XHJcblx0XHRcdGNhbGxiYWNrPy5hcHBseSBfdGhpcywgYXJndW1lbnRzXHJcblx0XHRcdGxvYWRSZXNOdW1iZXItLVxyXG5cdFx0XHRpZiBsb2FkUmVzTnVtYmVyIDw9IDBcclxuXHRcdFx0XHRfdGhpcy5yZXNldCgpXHJcblx0XHRcdFx0X3RoaXMudHJpZ2dlciAnbG9hZCdcclxuXHRcdFx0X3RoaXMudXBkYXRlUGVyY2VudCgpXHJcblxyXG5cdGxvYWRKc29uOiAoZmlsZSwgY2FsbGJhY2spIC0+XHJcblx0XHRjYWxsYmFjayA9IEBsb2FkIGNhbGxiYWNrXHJcblx0XHQkLmdldEpTT04gZmlsZSArICcuanNvbidcclxuXHRcdFx0LmRvbmUgY2FsbGJhY2tcclxuXHRcdFx0LmZhaWwgLT5cclxuXHRcdFx0XHRjYWxsYmFjayBudWxsXHJcblxyXG5cdGxvYWRJbWFnZTogKGZpbGUsIGNhbGxiYWNrKSAtPlxyXG5cdFx0Y2FsbGJhY2sgPSBAbG9hZCBjYWxsYmFja1xyXG5cdFx0aW1nID0gbmV3IEltYWdlXHJcblx0XHRpbWcub25sb2FkID0gLT5cclxuXHRcdFx0Y2FsbGJhY2sgaW1nXHJcblx0XHRpbWcuc3JjID0gZmlsZVxyXG5cdFx0aW1nXHJcblxyXG5leHBvcnQgeyBMb2FkZXIgfSIsImltcG9ydCB7IE1vZGVsRGF0YSwgTW9kZWwgfSBmcm9tICcuL21vZGVsJ1xyXG5pbXBvcnQgeyBBbmltYXRpb25EYXRhIH0gZnJvbSAnLi9hbmltYXRpb24nXHJcbmltcG9ydCB7IExvYWRlciB9IGZyb20gJy4vbG9hZGVyJ1xyXG5cclxuJChkb2N1bWVudCkucmVhZHkgLT5cclxuXHQkY2FudmFzID0gJCAnI2NhbnZhcydcclxuXHRjYW52YXMgPSAkY2FudmFzLmdldCAwXHJcblx0Y29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0ICcyZCcsIGFscGhhOiBmYWxzZVxyXG5cclxuXHRtb2RlbEZpbGUgPSAnbW9kZWxzL2FyZW5hJ1xyXG5cdGxvYWRlciA9IG5ldyBMb2FkZXJcclxuXHRtb2RlbCA9IG5ldyBNb2RlbFxyXG5cdG1vZGVsRGF0YSA9IG5ldyBNb2RlbERhdGFcclxuXHRhbmltYXRpb25GcmFtZSA9IG51bGxcclxuXHRjYW1lcmEgPVxyXG5cdFx0Y2FudmFzOiBjYW52YXNcclxuXHRcdGc6IGNvbnRleHRcclxuXHRcdHg6IDBcclxuXHRcdHk6IDBcclxuXHRcdHo6IDBcclxuXHJcblx0cmVzaXplID0gLT5cclxuXHRcdGNhbnZhcy53aWR0aCA9ICQod2luZG93KS53aWR0aCgpXHJcblx0XHRjYW52YXMuaGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpIC0gJCgnI2NhbnZhcycpLm9mZnNldCgpLnRvcFxyXG5cclxuXHRyZXNpemUoKVxyXG5cclxuXHQkKHdpbmRvdykub24gJ3Jlc2l6ZScsIHJlc2l6ZVxyXG5cclxuXHRtb2RlbFJlZnJlc2ggPSAtPlxyXG4jXHRcdGZvciBrZXksIF8gb2YgbW9kZWxEYXRhXHJcbiNcdFx0XHRkZWxldGUgbW9kZWxEYXRhW2tleV1cclxuXHRcdG1vZGVsRGF0YS5sb2FkIGxvYWRlciwgbW9kZWxGaWxlXHJcblx0XHJcblx0bG9hZGVyLm9uICdsb2FkJywgLT5cclxuXHRcdG1vZGVsLnNldERhdGEgbW9kZWxEYXRhXHJcblx0XHRpZiBtb2RlbC5hbmltYXRpb24uZGF0YVxyXG5cdFx0XHQjIG1vZGVsLmFuaW1hdGlvbi5zZXQgJ3Rlc3QnXHJcblx0XHRcdCNcclxuXHRcdFx0Y29udGFpbmVyID0gJCAnLmpzLWZyYW1lLWNvbnRhaW5lcidcclxuXHRcdFx0Y29udGFpbmVyLmVtcHR5KClcclxuXHRcdFx0Zm9yIGFuaW0sIF8gb2YgbW9kZWwuYW5pbWF0aW9uLmRhdGFcclxuXHRcdFx0XHRjb250YWluZXIuYXBwZW5kIFwiPGEgY2xhc3M9J2Ryb3Bkb3duLWl0ZW0ganMtZnJhbWUtc2VsZWN0JyBocmVmPScjJz4je2FuaW19PC9hPlwiXHJcblx0XHRcdG1vZGVsLmFuaW1hdGlvbi5zZXQgYW5pbWF0aW9uRnJhbWVcclxuXHRcdFx0JCgnLmpzLWZyYW1lLXNlbGVjdCcpLmNsaWNrIC0+XHJcblx0XHRcdFx0YW5pbWF0aW9uRnJhbWUgPSAkKHRoaXMpLnRleHQoKVxyXG5cdFx0XHRcdG1vZGVsLmFuaW1hdGlvbi5zZXQgYW5pbWF0aW9uRnJhbWVcclxuXHJcblx0Y29uc29sZS5sb2cgbW9kZWxcclxuXHJcblx0bVJlZnJlc2hJbnRlcnZhbCA9IHNldEludGVydmFsIG1vZGVsUmVmcmVzaCwgNTAwXHJcblxyXG5cdHJlbmRlciA9IChkZWx0YSkgLT5cclxuXHRcdGNvbnRleHQuc2F2ZSgpXHJcblx0XHR3ID0gY2FudmFzLndpZHRoXHJcblx0XHRoID0gY2FudmFzLmhlaWdodFxyXG5cdFx0Y3ggPSB3IC8gMlxyXG5cdFx0Y3kgPSBoIC8gMlxyXG5cdFx0Y29udGV4dC5maWxsU3R5bGUgPSAnI2ZmZidcclxuXHRcdGNvbnRleHQuZmlsbFJlY3QgMCwgMCwgdywgaFxyXG5cdFx0Y29udGV4dC5iZWdpblBhdGgoKVxyXG5cdFx0Y29udGV4dC5saW5lV2lkdGggPSAyXHJcblx0XHRjb250ZXh0LnN0cm9rZVN0eWxlID0gJyNmMDAnXHJcblx0XHRjb250ZXh0Lm1vdmVUbyBjeCwgMFxyXG5cdFx0Y29udGV4dC5saW5lVG8gY3gsIGhcclxuXHRcdGNvbnRleHQubW92ZVRvIDAsIGN5XHJcblx0XHRjb250ZXh0LmxpbmVUbyB3LCBjeVxyXG5cdFx0Y29udGV4dC5zdHJva2UoKVxyXG5cclxuXHRcdGNvbnRleHQudHJhbnNsYXRlIGN4LCBjeVxyXG5cclxuXHRcdG1vZGVsLmFuaW1hdGlvbi5wbGF5KClcclxuXHJcblx0XHRtb2RlbC5kcmF3UGFydHMgY29udGV4dCwgY2FtZXJhXHJcblxyXG5cdFx0TW9kZWwudHJhbnNmb3JtKDAsIDAsIDAsIGNhbWVyYSlcclxuXHRcdFx0LmFwcGx5IGNvbnRleHRcclxuXHJcblx0XHRtb2RlbC5kcmF3MkQgY29udGV4dFxyXG5cclxuXHRcdGNvbnRleHQucmVzdG9yZSgpXHJcblx0XHQjIFxyXG5cdFx0d2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSByZW5kZXJcclxuXHJcblx0cmVuZGVyKDApXHJcblxyXG5cdG9sZE1vdXNlWCA9IG9sZE1vdXNlWSA9MFxyXG5cdG1vdmVDYW1lcmEgPSAoZSkgLT5cclxuXHRcdGNhbWVyYS54ICs9IGUuY2xpZW50WCAtIG9sZE1vdXNlWFxyXG5cdFx0Y2FtZXJhLnkgKz0gZS5jbGllbnRZIC0gb2xkTW91c2VZXHJcblx0XHRvbGRNb3VzZVggPSBlLmNsaWVudFhcclxuXHRcdG9sZE1vdXNlWSA9IGUuY2xpZW50WVxyXG5cclxuXHQkY2FudmFzLm9uICdtb3VzZWRvd24nLCAoZSkgLT5cclxuXHRcdG9sZE1vdXNlWCA9IGUuY2xpZW50WFxyXG5cdFx0b2xkTW91c2VZID0gZS5jbGllbnRZXHJcblx0XHQkY2FudmFzLm9uICdtb3VzZW1vdmUnLCBtb3ZlQ2FtZXJhXHJcblxyXG5cdCRjYW52YXMub24gJ3RvdWNoc3RhcnQnLCAoZSkgLT5cclxuXHRcdG9sZE1vdXNlWCA9IGUudG91Y2hlc1swXS5jbGllbnRYXHJcblx0XHRvbGRNb3VzZVkgPSBlLnRvdWNoZXNbMF0uY2xpZW50WVxyXG5cclxuXHQkY2FudmFzLm9uICd0b3VjaG1vdmUnLCAoZSkgLT5cclxuXHRcdG1vdmVDYW1lcmEgZS50b3VjaGVzWzBdXHJcblxyXG5cdCRjYW52YXMub24gJ21vdXNldXAnLCAtPlxyXG5cdFx0JGNhbnZhcy5vZmYgJ21vdXNlbW92ZScsIG1vdmVDYW1lcmFcclxuXHJcblx0JCgnLmpzLXotbnVtYmVyJylcclxuXHRcdC52YWwgY2FtZXJhLnpcclxuXHRcdC5vbiAnaW5wdXQgY2hhbmdlJywgLT5cclxuXHRcdFx0Y2FtZXJhLnogPSArICQodGhpcykudmFsKClcclxuXHJcblx0JCgnLmpzLW1vZGVsLXNlbGVjdCcpLmNsaWNrIC0+XHJcblx0XHRtb2RlbERhdGEgPSBuZXcgTW9kZWxEYXRhXHJcblx0XHRtb2RlbEZpbGUgPSAkKHRoaXMpLmRhdGEgJ2ZpbGUnXHJcblxyXG5cdCQoJy5qcy1hbmltLXNlbGVjdCcpLmNsaWNrIC0+XHJcblx0XHRmaWxlID0gJCh0aGlzKS5kYXRhICdmaWxlJ1xyXG5cdFx0bW9kZWwuYW5pbWF0aW9uLmRhdGEgPSBuZXcgQW5pbWF0aW9uRGF0YVxyXG5cdFx0bW9kZWwuYW5pbWF0aW9uLmRhdGEubG9hZCBsb2FkZXIsIGZpbGVcclxuXHRcdCQoJy5qcy1hbmltLXJlZnJlc2gnKS5kYXRhICdmaWxlJywgZmlsZVxyXG5cdFx0I1xyXG5cdFx0JCgnLmpzLXJlZnJlc2gtbW9kZWwnKS5wcm9wICdjaGVja2VkJywgZmFsc2VcclxuXHRcdGNsZWFySW50ZXJ2YWwgbVJlZnJlc2hJbnRlcnZhbFxyXG5cclxuXHRNb2RlbC5kcmF3T3JpZ2luID0gdHJ1ZVxyXG5cdCQoJy5qcy1kcmF3LW9yaWdpbicpLmNoYW5nZSAtPlxyXG5cdFx0TW9kZWwuZHJhd09yaWdpbiA9ICQodGhpcykucHJvcCAnY2hlY2tlZCdcclxuXHJcblx0JCgnLmpzLXJlZnJlc2gtbW9kZWwnKS5jaGFuZ2UgLT5cclxuXHRcdGlmICQodGhpcykucHJvcCAnY2hlY2tlZCdcclxuXHRcdFx0bVJlZnJlc2hJbnRlcnZhbCA9IHNldEludGVydmFsIG1vZGVsUmVmcmVzaCwgNTAwXHJcblx0XHRlbHNlXHJcblx0XHRcdGNsZWFySW50ZXJ2YWwgbVJlZnJlc2hJbnRlcnZhbFxyXG5cclxuXHQkKCcuanMtcmVzZXQtcG9zJykuY2xpY2sgLT5cclxuXHRcdGNhbWVyYS54ID0gY2FtZXJhLnkgPSBjYW1lcmEueiA9IDBcclxuXHRcdCQoJy5qcy16LW51bWJlcicpLnZhbCAnMCdcclxuXHJcblx0ZnVsbHNjcmVlbiA9IGZhbHNlXHJcblx0JCgnLmpzLWZ1bGwtc2NyZWVuJykuY2xpY2sgLT5cclxuXHRcdGlmIGZ1bGxzY3JlZW5cclxuXHRcdFx0Y2FuY2VsRnVsbHNjcmVlbigpXHJcblx0XHRlbHNlXHJcblx0XHRcdGxhdW5jaEZ1bGxTY3JlZW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50XHJcblx0XHRmdWxsc2NyZWVuID0gIWZ1bGxzY3JlZW5cclxuXHJcblx0bGF1bmNoRnVsbFNjcmVlbiA9IChlbGVtZW50KSAtPlxyXG5cdFx0aWYgZWxlbWVudC5yZXF1ZXN0RnVsbFNjcmVlblxyXG5cdFx0XHRlbGVtZW50LnJlcXVlc3RGdWxsU2NyZWVuKClcclxuXHRcdGVsc2UgaWYgZWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlblxyXG5cdFx0XHRlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuKClcclxuXHRcdGVsc2UgaWYgZWxlbWVudC53ZWJraXRSZXF1ZXN0RnVsbFNjcmVlblxyXG5cdFx0XHRlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuKClcclxuXHJcblx0Y2FuY2VsRnVsbHNjcmVlbiA9IC0+XHJcblx0XHRpZiBkb2N1bWVudC5jYW5jZWxGdWxsU2NyZWVuXHJcblx0XHRcdGRvY3VtZW50LmNhbmNlbEZ1bGxTY3JlZW4oKVxyXG5cdFx0ZWxzZSBpZiBkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuXHJcblx0XHRcdGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4oKVxyXG5cdFx0ZWxzZSBpZiBkb2N1bWVudC53ZWJraXRDYW5jZWxGdWxsU2NyZWVuXHJcblx0XHRcdGRvY3VtZW50LndlYmtpdENhbmNlbEZ1bGxTY3JlZW4oKSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUEsSUFBQTs7QUFBTTtFQUFOLE1BQUEsT0FBQTtJQUdRLE9BQU4sSUFBTSxDQUFDLE1BQUQsRUFBUyxJQUFUO1VBQ047TUFBQSxNQUFBLEdBQVMsTUFBTSxDQUFDLEtBQU0sQ0FBQSxJQUFBO01BQ3RCLElBQUEsQ0FBTyxNQUFQO1FBQ0MsTUFBQSxHQUFTLElBQUk7UUFDYixNQUFNLENBQUMsSUFBUCxDQUFZLE1BQVosRUFBb0IsSUFBcEI7UUFDQSxNQUFNLENBQUMsS0FBTSxDQUFBLElBQUEsQ0FB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
