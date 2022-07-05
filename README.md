
# Node - API

A brief description of what this project does and who it's for


# Creating  a new "Model"

Since you completed the setup, the next step is to start adding models in your project.

Creating a new model in the project comes with a few stuff. Before we go through these stuff, try to run this script.

`` npm run addmodel testmodel ``

This script will generate a couple of files in the project.

* `./models/testmodel.json`
* `./resources/testmodelResource.js`

The `./models` directory is the JSON visualization of every table in your database. 
In order to easily apply changes in any table and create or delete fields in your table
you can edit this JSON file and apply those changes using the **migrations** scripts.

The `./resources` directory is the class that handles the the API calls for this model.

For example, if a GET request arrives in the server (`http://localhost:9000/api/v1/testmodel`), 
the function that will handle this request and be responsible for what to response will be
the `__get__(self,params)` inside the created resource file for this model!


# Database Model

Now that we created our first test model in the project, let's take a deeper look
on how do the models work.

First things first, we need to open the `./models/testmodel.json` model file.

It should look like this : 

```
{
    "testmodel": {
        "name": "testmodel",
        "vname": "testmodel",
        "endpoint": "testmodel",
        "resourceName": "testmodelResource",
        "inputGroups": [],
        "fields": [
            {
                "fname": "test",
                "type": "str",
                "len": 160,
                "def": "",
                "hlp": "Just a test field so table is not empty"
            }
        ]
    }
}
```

A few things about what we see in this JSON file.

* `name` : Represents the table name in the database
* `endpoint` : The model name in the API requests (see `/api/v1/testmodel`)
* `resourceName` : The classname that will handle the API requests
* `fields` : JSON representation of database table fields
    - `fname`: The table field name in the database table
    - `type` : The type of the table field. More about the types **here**
    - `def`  : The default value of the field in case non provided (Has to be compatible with the field type)
    - `hlp` (OPTIONAL) : Just a help text to describe the purpose of this table field





# Resources

Moving on to the resources , in order to create API handlers for our new testmodel!

Navigate to `./resources` folder and open the `testmodelResource.js` file.

It should look like this : 

```
exports.testmodelResource = class extends master.masterResource {
        constructor(){
            super();
            this.testmodel = objects.databases.testmodel;
            super.initialize(this.testmodel);
        }
        
        __authorize__(self){
            // authorization for all requests of testmodel
            // "self" parameter is an object with two attributes
            // "req" (request object) and "res"(response object)
            return true
        }
    }
```

Notice that the `testModelResource` class extends the `masterResource`
that is imported at the top of the file. 

*This class contains all the required function for a resource to properly handle
API requests in any model.*

### Resource Authorization

The model API handler allows you to modify the `__authorize__` function that will 
be called every time a request in this model comes. This function must return `true`
in order to proceed with the request , in any other case a **403 Bad Authentication**
response will be returned.

So in case you want to exclusively handle the authentication of requests for a 
specific model, this is the place to do so.

### REST Api Functions

Because the resource extends the `masterResource` class, the whole REST API functions
are already working properly. So if you try to run a GET request in the model, the server
will respond with the items in the database.

Most of the time though , you will need to modify the response or decide if 
you want to respond with data. So you will need to modify the REST API functions
of the resource handler. All you need to do is to add some functions in the handler :

#### HTTP /GET

To access the database record use the `this.db.get()` function and pass the id of the record
you want to retrieve. In case you want all the records of a model, pass `-1` as argument.

```
async __get__(self,params,kwargs){
    let response_records = [];

    if(kwargs && kwargs.rowid){
        // Get a specific record from the testmodel
        // https://localhost:9000/api/v1/testmodel/4452
        response_records = await this.db.get(kwargs.rowid);
    }
    else{
        // Get all records from the testmodel //
        // https://localhost:9000/api/v1/testmodel
        response_records = await this.db.get(-1);
    }
}
```

The `__get__` function is responsible for the GET request.

* `self` Is the object that contains the Request and Response object 
    - `self.req` Request object
    - `self.res` Response object

* `params` Is the object that contains all the parameters that comes in the request body.

* `kwargs` Is the argument that comes in the endpoint after the model name. It is used in case the client wants to get a specific item from the model. For example if the request is `http://localhost:9000/api/v1/testmodel/4452` the **kwargs** will be `{rowid: 4452}`.



#### HTTP /POST

To create a new record in the database, first you must create a proper database record object.

Use the function `let record = dbs.newRecord(this.db.db, params)` for this purpose.

Then when you are ready, to create the record in the database just like in the GET function, 
use the `this.db.insert(record)`.

```
async __insert__(self,params){
    let record = dbs.newRecord(this.db.db, params);

    /// Do anything you want here with the database record ///

    await this.db.insert(record);
}
```

The `__insert__` function is responsible for the POST request.

* `self` Is the object that contains the Request and Response object 
    - `self.req` Request object
    - `self.res` Response object

* `params` Is the object that contains all the parameters that comes in the request body.

#### HTTP /PUT

To access and update the database record , use the `this.db.update()` function and pass 
the updated record object as an argument. You will need to add the `rowid` attribute in the
updated object otherwise the query will fail.

```
async __update__(self,params,kwargs){
    params.rowid = kwargs.rowid;

    await this.db.update(params);
}
```

The `__update__` function is responsible for the PUT request.

* `self` Is the object that contains the Request and Response object 
    - `self.req` Request object
    - `self.res` Response object

* `params` Is the object that contains all the parameters that comes in the request body.

* `kwargs` Is the argument that comes in the endpoint after the model name. It is used in case the client wants to get a specific item from the model. For example if the request is `http://localhost:9000/api/v1/testmodel/4452` the **kwargs** will be `{rowid: 4452}`.

#### HTTP /DELETE

To access and delete a database record , use the `this.db.remove()` function and pass the id
of the record you want to delete.

```
async __remove__(self,params,kwargs){
    let rowid = kwargs.rowid;

    await this.db.remove(rowid);
}
```

The `__remove__` function is responsible for the DELETE request.

* `self` Is the object that contains the Request and Response object 
    - `self.req` Request object
    - `self.res` Response object

* `params` Is the object that contains all the parameters that comes in the request body.

* `kwargs` Is the argument that comes in the endpoint after the model name. It is used in case the client wants to get a specific item from the model. For example if the request is `http://localhost:9000/api/v1/testmodel/4452` the **kwargs** will be `{rowid: 4452}`.



### Data Serialization

In case you need to modify some fields (or make sure it's on the proper format) before 
creating/updating a record in the database, you can use the serialization functions.

It works as easy as the REST API handlers , just by creating some functions. In our test model ,
we have a field that's called `test`. So let's say we want to make sure that this field 
will always be a string before we execute the Database Query to insert/update a record.

All we have to do is to create a function `serialize_test(data)` in our resource.

```
serialize_test(data){
    if(typeof(data) !== "String"){
        return '';
    }

    return data;
}
```

### Data Deserialization

Just like with data serialization , we may want to modify some data before we send back
the response to the client.

So let's say we want our `test` field to always go back in the client as "Hello client",
no matter what's the value in the database.

All we have to do is to create a function `deserialize_test(data)` in our resource.

```
deserialize_test(data){
    return "Hello client";
}
```

*Carefull, this does not mean that the response of the request will be "Hello client".
The actual response will be `{test: "Hello Client"}`*

### Private Fields

In case you want some fields of the model to never be sent back to the client,
you can easily flag those fields as `private_fields` at the constructor of
the API handler.

```
constructor(){
    super();
    this.testmodel = objects.databases.testmodel;

    private_fields:[
        "test"
    ]

    super.initialize(this.testmodel);
}
```

### META attribute

Meta attribute is a constructor argument in a resource handler , that comes with 
a lot of optional arguments. Some basic options are :

#### ALLOWED_METHODS <ARRAY[]>

Define a list of allowed HTTP METHODS for this model.

For example , if you don't want to allow a deletion of a record via HTTP add 
this to your resource constructor.

```
constructor() {
    super();
    this.testmodel = objects.databases.testmodel;

    ALLOWED_METHODS: ["GET", "POST", "PUT"];

    super.initialize();
}
```

#### SAFE_AUTH_METHODS <ARRAY[]>

Define a list of HTTP METHODS that will bypass the authentication function.

Same as with `ALLOWED_METHODS`, if you want the HTTP GET function to by pass the 
`__authorize__` function of the resource, just add this to your resource constructor.

```
constructor() {
    super();
    this.testmodel = objects.databases.testmodel;

    SAFE_AUTH_METHODS: ["GET"];

    super.initialize();
}
```



# Migrations

Now that we have our model and we know how our model API handler works, it's time to 
go and add some new fields to our model.

First open the model JSON file located in `./models/testmodel.json`.

In the fields list , we will add another String type field called `random_id`, 
to have a random generated ID for every created record.

```
{
    "fname": "random_id",
    "type": "str",
    "len": 160,
    "def": "",
    "hlp": "Random ID for every record"
}
```

### Create Migration Files

After we save our model file, we will run the create migrations script in order to generate 
the script file that will execute the Database query so our table field will actually be created
in the Database.

Head back to the terminal and run the command

``` npm run createmigrations ```

You will now see in the `./migrations` directory a new file called `0001_add_field_random_id.js`

### Execute Migration Files

Once the migration script is created , we will have to run this script in order to 
execute the proper database queries so our field will be created in the table.

Once again , go back to the terminal and run the command 

``` npm run runmigrations ```

This command will search to execute any migration scripts that are not executed yet.

Now our testmodel has a new `random_id` field in the database.
