(function () {
    'use strict';

var identity = function (x) {
    return x;
};

var dot = function (key, object) {
    return object[key];
};

var partial = function (f) {
    var args = Array.prototype.slice.call(arguments, 1);
    return function () {
        var remainingArgs = Array.prototype.slice.call(arguments);
        return f.apply(null, args.concat(remainingArgs));
    };
};

var isArray = function (value) {
    return value instanceof Array;
};

var isObject = function (value) {
    return !isArray(value) && (value instanceof Object);
};

var isFunction = function (value) {
    return value instanceof Function;
};

var isEmpty = function (object) {
    for(var i in object) {
        if(object.hasOwnProperty(i)) {
            return false;
        }
    }
    return true;
};

//deep copy of json objects
var copy = function (object) {
    return JSON.parse(JSON.stringify(object));
};

var foreach = function (collection, callback) {
    for(var i in collection) {
        if(collection.hasOwnProperty(i)) {
            callback(collection[i], i, collection);
        }
    }
};

var mapToArray = function (collection, callback) {
    var mapped = [];
    foreach(collection, function (value, key, coll) {
        mapped.push(callback(value, key, coll));
    });
    return mapped;
};

var mapToObject = function (collection, callback, keyCallback) {
    var mapped = {};
    foreach(collection, function (value, key, coll) {
        key = keyCallback ? keyCallback(key) : key;
        mapped[key] = callback(value, key, coll);
    });
    return mapped;
};

var map = function (collection, callback, keyCallback) {
    return isArray(collection) ?
        mapToArray(collection, callback) :
        mapToObject(collection, callback, keyCallback);
};

var keys = function (collection) {
    return mapToArray(collection, function (val, key) {
        return key;
    });
};

var values = function (collection) {
    return mapToArray(collection, function (val) {
        return val;
    });
};

var reduce = function (collection, callback) {
    var accumulation;
    foreach(collection, function (val, key) {
        accumulation = callback(accumulation, val, key, collection);
    });
    return accumulation;
};

var filter = function (collection, callback) {
    var filtered;

    if(isArray(collection)) {
        filtered = [];
        foreach(collection, function (val, key, coll) {
            if(callback(val, key, coll)) {
                filtered.push(val);
            }
        });
    }
    else {
        filtered = {};
        foreach(collection, function (val, key, coll) {
            if(callback(val, key, coll)) {
                filtered[key] = val;
            }
        });
    }

    return filtered;
};

var union = function () {
    var united = {};
    foreach(arguments, function (object) {
        foreach(object, function (value, key) {
            united[key] = value;
        });
    });
    return united;
};

var mixinPubSub = function (object) {
    object = object || {};
    var topics = {};

    object.publish = function (topic, data) {
        foreach(topics[topic], function (callback) {
            callback(data);
        });
    };

    object.subscribe = function (topic, callback) {
        topics[topic] = topics[topic] || [];
        topics[topic].push(callback);
    };

    object.unsubscribe = function (callback) {
        foreach(topics, function (subscribers) {
            var index = subscribers.indexOf(callback);
            if(index !== -1) {
                subscribers.splice(index, 1);
            }
        });
    };

    return object;
};

var createModel = function (fig) {
    fig = fig || {};
    var that = mixinPubSub(),
        url = fig.url,
        data = fig.data || {},
        id = fig.id,
        ajax = fig.ajax || function (fig) {
            $.ajax({
                url: that.isNew() ? url : url + '/' + that.id(),
                method: fig.method,
                data: fig.method === 'PUT' || fig.method === 'DELETE' ?
                        JSON.stringify(data) : data,
                dataType: 'json',
                success: fig.success,
                error: function (jqXHR) {
                    if(jqXHR.status === 409) {
                        that.publish('error', jqXHR.responseJSON);
                    }
                }
            });
        };

    that.isNew = function () {
        return id === undefined ? true : false;
    };

    that.id = function () {
        return id;
    };

    that.get = function (key) {
        return key ? data[key] : copy(data);
    };

    that.set = function (newData) {
        foreach(newData, function (value, key) {
            data[key] = value;
        });
        that.publish('change', that);
    };

    that.clear = function () {
        data = {};
        id = undefined;
        that.publish('change', that);
    };

    that.validate = fig.validate || function () {
        return {};
    };

    that.save = function () {
        var errors = that.validate(that.get());
        if(isEmpty(errors)) {
            ajax({
                url: that.isNew() ? url : url + '/' + id,
                method: that.isNew() ? 'POST' : 'PUT',
                data: data,
                success: function (response) {
                    var wasNew = that.isNew();
                    id = that.isNew() ? response : id;
                    that.publish('saved', wasNew);
                }
            });
        }
        that.publish('error', errors);
    };

    that.delete = function () {
        console.log('delete', that.id());
        if(!that.isNew()) {
            ajax({
                url: url + '/' + id,
                method: 'DELETE',
                success: function (response) {
                    console.log('delete success', response);
                    var id = that.id();
                    that.clear();
                    that.publish('destroyed', id);
                }
            });
        }
        else {
            that.clear();
        }
    };

    return that;
};

var createFormTemplate = function (schema, crudName) {

    var createInput = function (item, name) {

        var input = function (checked, value, isInputClass) {
            isInputClass = isInputClass === undefined ? true : isInputClass;
            var valueHTML = function () {
                return item.type === 'checkbox' || item.type === 'radio' ?
                    'value="' + value + '" ' : 'value="{{' + name + '}}" ';
            };

            var id = function () {
                return item.type === 'checkbox' || item.type === 'radio' ?
                    'id="' + name + '-' + value + '" ' :
                    'id="' + crudName + '-' + name + '" ';
            };

            return '' +
            (isInputClass ? '<div class="input">' : '') +
                '<input type="' + item.type + '" ' + id() +
                        'name="' + name + '" ' + valueHTML() +
                        (checked ? 'checked' : '') + '/>' +
            (isInputClass ? '</div>' : '');
        };

        var inputGroup = function () {
            return '' +
            '<div class="input">' +
                reduce(item.values, function (acc, value) {
                    return (acc || '') +
                    '<label for="' + name + '-' + value + '">' +
                        value +
                    '</label>' +
                    '{{#' + name + '.' + value + '}}' +
                        input(true, value, false) +
                    '{{/' + name + '.' + value + '}}' +
                    '{{^' + name + '.' + value + '}}' +
                        input(false, value, false) +
                    '{{/' + name + '.' + value + '}}';
                }) +
            '</div>';
        };

        switch(item.type) {
            case 'text':
                return input();

            case 'password':
                return input();

            case 'textarea':
                return '' +
                '<div class="input">' +
                    '<textarea id="' + crudName + '-' + name + '" ' +
                              'name="' + name + '">' +
                        '{{' + name + '}}' +
                    '</textarea>' +
                '</div>';

            case 'checkbox':
                return inputGroup();

            case 'radio':
                return inputGroup();

            case 'select':
                return '' +
                '<div class="input">' +
                    '<select name="' + name + '">' +
                        reduce(item.values, function (acc, value) {
                            acc = acc || '';
                            return acc +
                            '{{#' + name + '.' + value + '}}' +
                                '<option value="' + value + '" selected>' +
                                    value +
                                '</option>' +
                            '{{/' + name + '.' + value + '}}' +
                            '{{^' + name + '.' + value + '}}' +
                                '<option value="' + value + '">' +
                                    value +
                                '</option>' +
                            '{{/' + name + '.' + value + '}}';
                        }) +
                    '</select>' +
                '</div>';

            default:
                throw 'Invalid input type: ' + item.type;
        }
    };

    return '' +
    '<form>' +
        '<fieldset>' +
            '<legend>' + crudName + '</legend>' +
            reduce(schema, function (acc, item, name) {
                return (acc || '') +
                '<div class="control-set">' +
                    '<label for="' + crudName + '-' + name + '" class="label">' +
                        name +
                    '</label>' +
                    createInput(item, name) +
                    '<div class="crud-help">{{' + name + 'Help}}</div>' +
                '</div>';
            }) +
            '<div class="control-set">' +
                '<div class="label">&nbsp;</div>' +
                '<div class="input">' +
                    '<input type="submit" class="js-crud-save" value="Save"/>' +
                    '<button id="crud-new-item" type="button">New ' + crudName + '</button>' +
                '</div>' +
            '</div>' +
        '</fieldset>' +
    '</form>';
};



var createListTemplate = function (schema, crudName) {
    return '' +
    '<table>' +
        '<thead>' +
            '<tr>' +
                '<th>' +
                    '<label for="crud-list-select-all">All</label>' +
                    '<input type="checkbox" id="crud-list-select-all"/>' +
                '</th>' +
                reduce(schema, function (acc, item, name) {
                    return (acc || '') + '<th>' + name + '</th>';
                }) +
            '</tr>' +
        '</thead>' +
        '<tbody id="crud-list-item-container"></tbody>' +
    '</table>' +
    '<button id="crud-delete-selected">Delete Selected</button>';
};

var createListItemTemplate = function (schema, crudName) {
    return '' +
    '<td><input type="checkbox" class="crud-list-selected"/></td>' +
    reduce(schema, function (acc, item, name) {
        return (acc || '') + '<td class="crud-list-item-column" name="' + name + '">{{' + name + '}}</td>';
    });
};

var createController = function (fig) {
    var that = {},
        el = fig.el,
        render = function (isRenderError, data, errors) {
            data = data || that.model.get();
            if(isRenderError) {
                errors = that.mapErrorData(union(that.model.validate(data), errors));
            }
            else {
                errors = {};
            }
            that.$().html(Mustache.render(that.template, union(
                that.mapModelToView(data),
                errors
                //isRenderError ? that.mapErrorData(that.model.validate(data)) : {}
            )));
        };

    that.mapErrorData = function (errorData) {
        return map(errorData, identity, function (key) {
            return key + 'Help';
        });
    };

    that.schema = fig.schema;
    that.model = fig.model;
    that.template = fig.template;

    that.$ = function (selector) {
        return selector ? $(el).find(selector) : $(el);
    };

    that.mapModelToView = function (modelData) {
        var isSelected = function (choice, value, name) {
            var type = that.schema[name].type;
            return type === 'radio' || type === 'select' ?
                choice === value : value.indexOf(choice) !== -1;
        };

        return map(modelData, function (value, name) {
            var type = that.schema[name].type;
            if(type === 'checkbox' || type === 'select' || type === 'radio' ) {
                var mappedValue = {};
                foreach(that.schema[name].values, function (choice) {
                    if(isSelected(choice, value, name)) {
                        mappedValue[choice] = true;
                    }
                });
                return mappedValue;
            }
            else {
                return value;
            }
        });
    };

    that.render = partial(render, true);
    that.renderNoError = partial(render, false);

    return that;
};

var createListItemController = function (fig) {
    fig = fig || {};
    fig.el = fig.el || '#crud-list-item-' + fig.model.id();
    var that = mixinPubSub(createController(fig));

    that.isSelected = function () {
        return that.$('.crud-list-selected').prop('checked') ? true : false;
    };

    var parentMapModelToView = that.mapModelToView;
    that.mapModelToView = function (modelData) {
        return map(parentMapModelToView(modelData), function (value, name) {
            if(isObject(value)) {
                return mapToArray(value, function (isSelected, name) {
                    return name;
                }).join(', ');
            }
            else {
                return value;
            }
        });
    };

    var parentRender = that.render;
    that.render = function (data) {
        parentRender(data);
        that.bindView();
    };

    that.select = function () {
        that.$().addClass('selected');
    };

    that.deselect = function () {
        that.$().removeClass('selected');
    };

    that.bindView = function () {
        that.$('.crud-list-item-column').hover(
            function () {
                that.$().addClass('hover');
            },
            function () {
                that.$().removeClass('hover');
            }
        );

        that.$('.crud-list-item-column').click(function () {
            that.publish('selected', that);
        });
    };

    that.model.subscribe('saved', function (model) {
        that.render();
    });

    return that;
};

var createListController = function (fig) {
    fig = fig || {};
    var that = createController(fig),
        items = [],
        renderItems = function () {
            var $container = that.$('#crud-list-item-container');
            $container.html('');
            foreach(items, function (item) {
                console.log(item.model.id());
                var elID = 'crud-list-item-' + item.model.id();
                $container.append(
                    '<tr id="' + elID + '" ' + 'class="list-item"></tr>'
                );
                item.render();
            });
            bind();
        },
        bind = function () {
            that.$('#crud-list-select-all').unbind();
            that.$('#crud-list-select-all').change(function (e) {
                that.$('.crud-list-selected').prop(
                    'checked', $(this).is(':checked')
                );
            });

            that.$('#crud-delete-selected').unbind();
            that.$('#crud-delete-selected').click(function (e) {
                console.log('delete selected click');
                e.preventDefault();
                foreach(items, function (listItemController) {
                    if(listItemController.isSelected()) {
                        listItemController.model.delete();
                    }
                });
            });
        };

    that.setSelected = function (selectedItemController) {
        foreach(items, function (itemController) {
            itemController.deselect();
        });
        if(selectedItemController) {
            selectedItemController.select();
        }
    };

    that.add = function (itemController) {
        items.push(itemController);
        renderItems();
    };

    that.getItemControllerByID = function (id) {
        return filter(items, function (controller) {
            return controller.model.id() === id;
        })[0];
    };

    that.remove = function (id) {
        items = filter(items, function (controller) {
            return controller.model.id() != id;
        });
        renderItems();
    };

    return that;
};

var createFormController = function (fig) {
    fig = fig || {};
    fig.model = fig.model || fig.createDefaultModel();
    var that = mixinPubSub(createController(fig));

    that.serialize = function () {
        return map(that.schema, function (item, name) {
            var getValue = function (pseudo) {
                return that.$('[name="' + name + '"]' + (pseudo || '')).val();
            };

            switch(item.type) {
                case 'radio':
                    return getValue(':checked');
                case 'select':
                    return getValue(' option:selected');
                case 'checkbox':
                    var checked = [];
                    that.$('[name="' + name + '"]:checked').each(function () {
                        checked.push($(this).val());
                    });
                    return checked;
                default:
                    return getValue();
            }
        });
    };

    var bind = function () {
        that.$().unbind();
        that.$().submit(function (e) {
            e.preventDefault();
            that.model.set(that.serialize());
            that.model.save();
        });

        $('#crud-new-item').unbind();
        $('#crud-new-item').click(function () {
            that.setModel(fig.createDefaultModel());
            that.publish('new');
        });
    };

    bind();

    var setNewModelButtonVisibility = function () {
        var $newItemButton = that.$('#crud-new-item');
        if(that.model.isNew() && !$newItemButton.is(':hidden')) {
            $newItemButton.hide();
        }
        else if(!that.model.isNew() && $newItemButton.is(':hidden')) {
            $newItemButton.show();
        }
    };

    var parentRender = that.render;
    that.render = function (data, errors) {
        parentRender(data, errors);
        setNewModelButtonVisibility();
        bind();
    };

    var parentRenderNoError = that.renderNoError;
    that.renderNoError = function (data) {
        parentRenderNoError(data);
        that.$('#crud-new-item').hide();
        setNewModelButtonVisibility();
        bind();
    };

    that.setModel = (function () {

        var changeCallback = function (model) {
            that.render();
        };

        var savedCallback = setNewModelButtonVisibility;

        var errorCallback = function (errors) {
            that.render(that.model.get(), errors);
        };

        return function (newModel) {
            that.model.unsubscribe(changeCallback);
            that.model.unsubscribe(savedCallback);
            that.model.unsubscribe(errorCallback);
            newModel.subscribe('change', changeCallback);
            newModel.subscribe('saved', savedCallback);
            newModel.subscribe('error', errorCallback);
            that.model = newModel;
            if(newModel.isNew()) {
                that.renderNoError();
            }
            else {
                that.render();
            }
        };

    }());

    that.setModel(that.model);

    return that;
};

this.createCRUD = function (fig) {
    fig = fig || {};
    var that = {},
        url = fig.url,
        name = fig.name,
        schema = map(fig.schema, function (item, name) {
            if(item.type === 'checkbox') {
                item.value = item.value || [];
            }
            return item;
        }),
        validate = fig.validate,
        createDefaultModel = function (data, id) {
            return createModel({
                id: id,
                url: url,
                data: data || map(schema, function (item) {
                    return item.value || null;
                }),
                validate: validate
            });
        };

    that.listTemplate = fig.listTemplate || createListTemplate(schema, name);
    that.listItemTemplate = fig.listItemTemplate || createListItemTemplate(schema, name);
    that.formTemplate = fig.formTemplate || createFormTemplate(schema, name);

    var listController = createListController({
        el: '#' + name + '-crud-list-container',
        schema: schema,
        model: createDefaultModel(),
        createModel: createDefaultModel,
        template: that.listTemplate
    });
    listController.renderNoError();

    var bindModel = function (model) {
        model.subscribe('saved', function (wasNew) {
            if(wasNew) {
                addItem(model);
            }
        });

        model.subscribe('destroyed', function (id) {
            console.log('destroyed', id);
            listController.remove(id);
        });

        return model;
    };

    var formController = createFormController({
        el: '#' + name + '-crud-container',
        schema: schema,
        createDefaultModel: function() {
            return bindModel(createDefaultModel());
        },
        template: that.formTemplate
    });

    formController.subscribe('new', function () {
        listController.setSelected();
    });

    var setForm = function (model) {
        formController.setModel(model);
    };

    var selectedCallback = function (itemController) {
        listController.setSelected(itemController);
        setForm(itemController.model);
    };

    var addItem = function (model) {
        var itemController = createListItemController({
            model: model,
            schema: schema,
            template: that.listItemTemplate
        });
        itemController.subscribe('selected', selectedCallback);
        listController.add(itemController);
        listController.setSelected(itemController);
        bindModel(model);
    };

    that.newItem = function () {
        var defaultModel = createDefaultModel();
        setForm(defaultModel);
        bindModel(defaultModel);
    };

    that.init = function () {
        that.newItem();
        $.ajax({
            url: url,
            method: 'GET',
            dataType: 'json',
            success: function (rows) {
                foreach(rows, function (row) {
                    var id = row.id;
                    delete row.id;
                    addItem(createDefaultModel(row, id));
                });
                listController.setSelected();
            }
        });
    };

    return that;
};

}).call(this);
