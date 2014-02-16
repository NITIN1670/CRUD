<!DOCTYPE html>
<html>
<head>
<title>CRUD</title>

<link rel="stylesheet" type="text/css" href="../lib/jquery-modal/jquery.modal.css">

<style>
    body {
       font-family: "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif;
       font-weight: 300;
    }

    body tr.selected td, body .crud-pages li a.selected {
        background-color: #A7EBBF;
    }

    .container tr.hover, .crud-pages a:hover {
        cursor: pointer;
        background-color: #DFECE4;
    }

    .crud-save-form .status {
        position: relative;
        padding: 0.5em;
        bottom: 0.5em;
        -webkit-border-radius: 5px;
        -moz-border-radius: 5px;
        border-radius: 5px;
    }

    .status .glyphicon {
        margin-left: 1em;
    }

    legend span {
        background-color: rgba(94, 169, 235, 0.5);
        width: 130px;
    }


    legend span.crud-status-edit {
        background-color: rgba(107, 221, 107, 0.5);
        width: 130px;
    }


    .crud-pages {
        display:block;
        margin: 0;
        padding: 0;
    }

    /*should not be given margin (messes up calculation to determine number
      of paginator pages to render)*/
    /*REQUIRED*/
    .crud-pages li {
        list-style: none;
        float: left;
    }

    .crud-list-item-container {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }

    .crud-pages a {
        padding: 0.5em;
    }

    .crud-pages li {
        padding-top: 0.5em;
        padding-bottom: 0.5em;
    }

    .crud-goto-page-form {
        float: right;
    }

    .crud-goto-page-form input[type="text"] {
        width: 7em;
    }

    body .crud-input-group {
        position: relative;
        top: 1px;
        margin: 0.7em 0.3em 0 0.3em;
    }

    .crud-delete-modal {
        height: 125px;
        width: 250px;
    }

    .btn {
        margin: 0.2em;
    }

    .error {
        color: rgb(236, 37, 37);
    }

    .crud-help {
        color: red;
    }

    body .crud-list-select-all {
        position: relative;
        top: 2px;
        margin: 0.3em;
    }
</style>
</head>

<body>
<div class="container">
    <h1>CRUD</h1>
    <hr/>


    <div id="Thing-crud-container" class="modal crud-form-modal"></div>

    <div id="Thing-crud-confirm-delete"></div>

    <div class="row">
        <div id="Thing-crud-new" class="col-sm-6"></div>
        <div id="Thing-crud-filter-container" class="col-sm-6"></div>
    </div>

    <div class="row">
        <div id="Thing-crud-paginator-nav" class="col-sm-12"></div>
    </div>

    <div class="row">
        <div id="Thing-crud-list-container" class="col-sm-12"></div>
        <div id="Thing-crud-no-results-message">No Results</div>
    </div>




    <div id="Thing2-crud-container" class="modal crud-form-modal"></div>

    <div id="Thing2-crud-confirm-delete"></div>

    <div class="row">
        <div id="Thing2-crud-new" class="col-sm-6"></div>
        <div id="Thing2-crud-filter-container" class="col-sm-6"></div>
    </div>

    <div class="row">
        <div id="Thing2-crud-paginator-nav" class="col-sm-12"></div>
    </div>

    <div class="row">
        <div id="Thing2-crud-list-container" class="col-sm-12"></div>
    </div>



</div>

<script src="../lib/jquery-1.10.2.js"></script>
<script src="../lib/mustache.js"></script>
<script src="../lib/jquery-modal/jquery.modal.js"></script>
<script src="src/lib.js"></script>
<script src="src/model/base.js"></script>
<script src="src/model/schema.js"></script>
<script src="src/model/request.js"></script>
<script src="src/model/filter.js"></script>
<script src="src/model/order.js"></script>
<script src="src/model/paginator.js"></script>
<script src="src/model/forminator.js"></script>
<script src="src/view/base.js"></script>
<script src="src/view/delete.js"></script>
<script src="src/view/filter.js"></script>
<script src="src/view/form.js"></script>
<script src="src/view/form_list.js"></script>
<script src="src/view/list.js"></script>
<script src="src/view/list_item.js"></script>
<script src="src/view/paginator.js"></script>
<script src="src/view/forminator.js"></script>
<script src="src/controller/base.js"></script>
<script src="src/controller/filter.js"></script>
<script src="src/controller/form.js"></script>
<script src="src/controller/form_list.js"></script>
<script src="src/controller/list.js"></script>
<script src="src/controller/list_item.js"></script>
<script src="src/controller/paginator.js"></script>
<script src="src/controller/forminator.js"></script>
<script src="src/crud.js"></script>

<!-- <script src="../crud.js"></script> -->

<script>
$(document).ready(function () {
    'use strict';
    var CRUDThing = CRUD.full({
        name: 'Thing',
        label: 'Thing Label',
        url: '../index.php',
        // url: '../crud_query_param.php',
        validate: function (data) {
            var error = {};
            if(data.text !== 'default') {
                error.text = 'text error';
            }
            if(data.letter === 'a') {
                error.GLOBAL = 'global message no a\'s';
            }
            return error;
        },

        //deletable: false,
        //readOnly: true,

        id: {
            orderable: true,
            order: 'ascending',
            label: 'id'
        },

        schema: [
            {
                name: 'text',
                label: 'label yo',
                type: 'text',
                value: 'default'
            },
            {
                name: 'textarea',
                type: 'textarea',
                orderable: true,
                order: 'ascending'
            },
            {
                name: 'fruit',
                type: 'checkbox',
                values: [
                    { value: 'apple', label: 'La Pomme' },
                    { value: 'orange', label: 'L\'Orange' }
                ],
                value: ['orange']
            },
            {
                name: 'letter',
                type: 'radio',
                values: [
                    { value: 'a', label: 'A' },
                    { value: 'b' },
                    { value: 'c' },
                    { value: 'd', label: 'D' }
                ],
                value: 'b',
                orderable: true
            },
            {
                name: 'awesome',
                type: 'select',
                values: [
                    { value: '1', label: 'One' },
                    { value: '2', label: 'Two' },
                    { value: '3', label: 'Three' }
                ]
            }
        ],

        instantFilter: true,
        filterSchema: [
            {
                name: "Maximum_Awesome",
                label: "Awesome",
                type: 'select',
                values: [
                    { value: '1', label: '<= One' },
                    { value: '2', label: '<= Two' },
                    { value: '3', label: '<= Three' }
                ],
                value: '3'
            },
            {
                name: "Search_Textarea",
                label: "Textarea",
                type: 'text'
            },
            {
                name: "fruit",
                type: 'checkbox',
                values: [
                    { value: 'apple', label: 'pomme' },
                    { value: 'orange' }
                ]
            }
        ]
    });



    var CRUDThing2 = CRUD.full({
        name: 'Thing2',
        label: 'Thing2 Label',
        url: '../index.php',
        // url: '../crud_query_param.php',
        validate: function (data) {
            var error = {};
            if(data.text !== 'default') {
                error.text = 'text error';
            }
            return error;
        },

        //deletable: false,
        //readOnly: true,

        id: {
            orderable: true,
            order: 'ascending',
            label: 'id'
        },

        schema: [
            {
                name: 'text',
                label: 'label yo',
                type: 'text',
                value: 'default'
            },
            {
                name: 'textarea',
                type: 'textarea',
                orderable: true,
                order: 'ascending'
            },
            {
                name: 'fruit',
                type: 'checkbox',
                values: [
                    { value: 'apple', label: 'La Pomme' },
                    { value: 'orange', label: 'L\'Orange' }
                ],
                value: ['orange']
            },
            {
                name: 'letter',
                type: 'radio',
                values: [
                    { value: 'a', label: 'A' },
                    { value: 'b' },
                    { value: 'c' },
                    { value: 'd', label: 'D' }
                ],
                value: 'b',
                orderable: true
            },
            {
                name: 'awesome',
                type: 'select',
                values: [
                    { value: '1', label: 'One' },
                    { value: '2', label: 'Two' },
                    { value: '3', label: 'Three' }
                ]
            }
        ],

        instantFilter: true,
        filterSchema: [
            {
                name: "Maximum_Awesome",
                label: "Awesome",
                type: 'select',
                values: [
                    { value: '1', label: '<= One' },
                    { value: '2', label: '<= Two' },
                    { value: '3', label: '<= Three' }
                ],
                value: '3'
            },
            {
                name: "Search_Textarea",
                label: "Textarea",
                type: 'text'
            },
            {
                name: "fruit",
                type: 'checkbox',
                values: [
                    { value: 'apple', label: 'pomme' },
                    { value: 'orange' }
                ]
            }
        ]
    });





    // before ajax starts and after it completes
    var debugSubscribeWaiting = function (type) {
        CRUDThing.subscribe(type + ':waiting:start', function (model) {
            console.log(type + ':waiting:start');
        });
        CRUDThing.subscribe(type + ':waiting:end', function (model) {
            console.log(type + ':waiting:end');
        });
    };

    // called whenever element is rerendered
    var debugSubscribeBind = function (type) {
        CRUDThing.subscribe('bind:' + type, function (jqueryRef) {
            console.log('bind:' + type);
        });
    };

    // debugSubscribeWaiting('form');
    // debugSubscribeWaiting('filter');
    // debugSubscribeWaiting('order');
    // debugSubscribeWaiting('paginator');

    // debugSubscribeBind('form');
    // debugSubscribeBind('filter');
    // debugSubscribeBind('list');
    // debugSubscribeBind('paginator');

});
</script>
</body>
</html>
