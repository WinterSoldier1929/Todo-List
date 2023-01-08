const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

const app = express();

mongoose.set("strictQuery", false);

mongoose.connect(MONGO_PASS).
    catch(error => handleError(error));

var options = {
        weekday: "long",
        day: "numeric",
        month:"long"
    };
var today = new Date();
var currentDay = today.toLocaleDateString("en-US",options);

const itemsSchema = new mongoose.Schema ({
    name: String
});

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

const Item = mongoose.model("Item",itemsSchema);

const List = mongoose.model("List",listSchema);

const item1 = new Item({
    name:"Wake Up"
});

const item2 = new Item({
    name:"Brush the teeth"
});

const item3 = new Item({
    name:"Eat breakfast"
});

const defaultArray = [item1,item2,item3];


app.set("view engine","ejs");

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.get("/",function(req,res){
    Item.find({},function(err,foundItems){
        if (foundItems.length === 0) {
            Item.insertMany(defaultArray, function (err){
                if (err) {
                    console.error(err);
                }
                else{
                    console.log("Items added successfully");
                }
            });
            res.redirect("/");
        } else{
            res.render("list",{kindofDay:currentDay, newListItems:foundItems});
        }  
    });

    
});

app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name:customListName}, function(err,foundList){
        if(!err){
            if(!foundList){
                const list = new List({
                    name: customListName,
                    items: defaultArray
                });
                list.save();
                res.redirect("/" + customListName);
            }
            else{
                res.render("list",{kindofDay:foundList.name, newListItems:foundList.items});
            }
        } 
    });
    
});


app.post("/",function(req,res){
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName,
    });

    if (listName == currentDay){
        item.save();
        res.redirect("/");
    }else{
        List.findOne({name:listName}, function(err,foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        });
    }
    
    
});   

app.post("/delete",function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName == currentDay){
        Item.findByIdAndRemove(checkedItemId, function(err){
            if(!err){
                console.log("Item deleted successfully");
                res.redirect("/");
            } 
        });
    }else{
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},function(err,foundList){
            if(!err){
                res.redirect("/"+listName);
            }
        });
        }
});

app.listen(process.env.PORT || 3000,function(){
    console.log("Server started successfully");
});