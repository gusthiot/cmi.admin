
const debug = require("debug")("shared.js");

export function makeTable(specific, displayId) {
    specific.columns.splice(0, 0, "_id");
    specific.columns.push("remove");
    return new Tabular.Table({
        name: specific.name,
        collection: specific,
        columns: _.map(specific.columns, function (colSymbol) {
            if(colSymbol === "remove") {
                return {
                    data: colSymbol,
                    orderable: false,
                    visible : true,
                    tmpl: Meteor.isClient && Template[specific.name + "$cell$" + colSymbol]
                };
            }
            else if(colSymbol === "_id" && !displayId) {
                return {
                    data: colSymbol,
                    orderable: false,
                    visible : false
                };

            }
            else {
                return {
                    data: colSymbol,
                    title: TAPi18n.__(specific.name + ".column." + colSymbol),
                    defaultContent: "-",
                    tmpl: Meteor.isClient && Template[specific.name + "$cell$" + colSymbol],
                };

            }
        }),
        language: Tabular.Translations.getCurrent(),
        // select: {
        //     style: "os",
        //     items: "cell",
        // },
        initComplete: function () {
            setupColumnFilterUI(Template[specific.name + "$Edit"].find().view, this, specific);
        },
        sPaginationType: 'meteor_template',
        paginationTemplate: Meteor.isClient && Template[specific.name + "$Pagination"],
        paginationUpdated: function () {
            debug("Pagination updated");
        }
    });
}


export function setupColumnFilterUI(parentView, dataTableElement, specific) {
    let columns = dataTableElement.api().columns();
    columns.every(function () {

        let column = this,
            type = specific.columns[column.index()];
        if (type === undefined || type === "remove") {
            return;
        }

        let context = {
            index: column.index(),
            type: type,
            values: function () {
                let values = _.uniq(_.pluck(_.sortBy(specific.find({}).fetch(), type), type),
                    true);
                values.push(undefined);
                return values;
            }
        };

        $(column.header()).empty();

        let view = Template[specific.name + "$columnHead"].constructView();
        view.templateInstance().dataTable = {
            column: column
        };

        Blaze.renderWithData(view, context, column.header(), undefined, parentView);
    });
}

export function isPositiveInteger(str) {
    let n = Math.floor(Number(str));
    return String(n) === str && n > 0;
}

export function isPositiveOrNullFloat2(str) {
    let n = Math.floor(100*Number(str))/100;
    return String(n) === str && n >= 0;
}

export function isOlderThan(oldTime,newTime) {
    return new Date(oldTime) < new Date(newTime);
}

export function isOlderThanOrEgal(oldTime,newTime) {
    return new Date(oldTime) <= new Date(newTime);
}

export function confirmRemove(name, id, collection) {
    sweetAlert({
            text: "Supprimer \"" + name + "\" ?",
            title: "",
            showCancelButton: true,
            confirmButtonColor: "#14dd4b",
            cancelButtonText: "Non",
            confirmButtonText: "Oui",
            closeOnConfirm: true
        },
        function(){
            collection.remove({_id: id});
        });

}