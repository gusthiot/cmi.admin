const Policies = new Meteor.Collection("policies");

Policies.name = "Policies";

Policies.schema = new SimpleSchema({
    _id: {
        label: "policy",
        type: SimpleSchema.Integer
    },
    name: {
        type: String
    },
    treeId: {
        type: SimpleSchema.Integer
    }
});

export const Levels = new Meteor.Collection("levels");

Levels.name = "Levels";

Levels.schema = new SimpleSchema({
    _id: {
        label: "level",
        type: SimpleSchema.Integer
    },
    name: {
        type: String
    }
});

const Accesses = new Meteor.Collection("accesses");

Accesses.name = "Accesses";

Accesses.schema = new SimpleSchema({
    levelId: {
        type: SimpleSchema.Integer
    },
    policyId: {
        type: SimpleSchema.Integer
    }
});

const Trees = new Meteor.Collection("trees");

Trees.name = "Trees";

Trees.schema = new SimpleSchema({
    _id: {
        type: SimpleSchema.Integer
    },
    name: {
        type: String
    }
});

if (Meteor.isServer) {
    //Trees.remove({});
    if (Trees.find({}).count() === 0) {
        Trees.insert({_id: "0", name: "users"});
    }

    //Policies.remove({});
    if (Policies.find({}).count() === 0) {
        Policies.insert({_id: "0", name: "canEditUsers", treeId: "0"});
        Policies.insert({_id: "1", name: "canViewUsers", treeId: "0"});
        Policies.insert({_id: "2", name: "canViewHimself", treeId: "0"});
        Policies.insert({_id: "3", name: "cannotViewUsers", treeId: "0"});
    }

    //Levels.remove({});
    if (Levels.find({}).count() === 0) {
        Levels.insert({_id: "0", name: "superAdmin"});
        Levels.insert({_id: "1", name: "admin"});
        Levels.insert({_id: "2", name: "customer"});
        Levels.insert({_id: "3", name: "projectLeader"});
        Levels.insert({_id: "4", name: "anyUser"});
    }

    //Accesses.remove({});
    if (Accesses.find({}).count() === 0) {
        Accesses.insert({levelId: "0", policyId: "0"});
        Accesses.insert({levelId: "1", policyId: "1"});
        Accesses.insert({levelId: "2", policyId: "1"});
        Accesses.insert({levelId: "3", policyId: "2"});
        Accesses.insert({levelId: "4", policyId: "3"});
    }

    Meteor.publish(Levels.name, function () {
        return Levels.find({});
    });

    Meteor.publish(Policies.name, function () {
        return Policies.find({});
    });

    Meteor.publish(Accesses.name, function () {
        return Accesses.find({});
    });
}

if (Meteor.isClient) {
    Meteor.subscribe(Levels.name);
    Meteor.subscribe(Policies.name);
    Meteor.subscribe(Accesses.name);
}

export function canEditUsers() {
    return check("canEditUsers");
}

export function canViewUsers() {
    return canEditUsers() || check("canViewUsers");
}

export function canViewHimself() {
    return canViewUsers() || check("canViewHimself");
}

function check(policy) {
    let levelId = Meteor.user().levelId;
    if(levelId) {
        let one = Policies.findOne({name: policy});
        if(one)
            return Accesses.findOne({levelId: levelId, policyId: one._id});
    }
    return false;
}
