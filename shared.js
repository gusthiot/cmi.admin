
const debug = require("debug")("shared.js");

export function makeTable(specific) {
    console.log("make " + specific.find({}).count());
    return new Tabular.Table({
        name: specific.name,
        collection: specific,
        columns: _.map(specific.columns, function (colSymbol) {
            return {
                data: colSymbol,
                title: TAPi18n.__(specific.name + ".column." + colSymbol),
                defaultContent: "-",
                tmpl: Meteor.isClient && Template[specific.name + "$cell$" + colSymbol],
            };
        }),
        language: Tabular.Translations.getCurrent(),
        select: {
            style: "os",
            items: "cell",
        },
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
    console.log("setup " + specific.find({}).count());
    let columns = dataTableElement.api().columns();
    columns.every(function () {

        let column = this,
            type = specific.columns[column.index()];
        if (type === undefined) {
            return;
        }

        console.log(specific.find({}).count());
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
