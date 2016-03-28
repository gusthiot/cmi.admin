# Business databases of CMi

## Deployment

Copy and modify `meteor-settings.json.sample` to indicate point to the
Kafka service (through the ZooKeeper IP and port), then run

```
meteor run --settings meteor-settings.json
```

## Code Convention

[Meteor](https://www.meteor.com/) is a really free-form framework. We
do have a few project-specific conventions, which make it easier to
build new functionality into it.

### Widget Names

**Widgets** are pieces of the UI (with their assorted model and
controller functionality) which can be re-used on multiple pages.
Their names look like `User$Pick`, where the part after $ has the role
of a method name (Pick, EditAll, EditFoo where Foo depends on the
access level etc.)
