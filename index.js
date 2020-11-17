// basic requirements
const express = require("express");
const bodyParser = require("body-parser");
const pdf = require("html-pdf");
const ejs = require("ejs");
const path = require("path");
const app = express();
const mysql = require("mysql");
var mysqlConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'W@$d QWERTY 148635',
  database: 'health'
});

/*----------------------------------------------------------------------------*/

//setting template engine to ejs
app.set("view engine", "ejs");

//setting up body parser to read form values
app.use(bodyParser.urlencoded({
  extended: true
}));

//setting the path for express to look for css and image files
app.use(express.static("public"));

//sql connection
mysqlConnection.connect((err) => {
  if (!err) {
    console.log("DB connected successfully");
  } else {
    console.log("DB connection failed \n Error: " + JSON.stringify(err, undefined, 2));
  }
});

/*----------------------------------------------------------------------------*/

// GLOBAL VARIABLES
var userName = '';
var obj = {};
var password = '';
/*----------------------------------------------------------------------------*/

// ALL GET ROUTES
// to go to home page
app.get("/", (req, res) => {
  res.render("login.ejs");
});

app.get("/about", (req,res)=>{
  res.render("about.ejs");
});

app.get("/signup", (req, res)=> {
  res.render("signup.ejs");
});

app.get("/login", (req, res)=> {
  res.render("login.ejs");
});

app.get("/success", (req, res)=> {
  res.render("success.ejs");
});

app.get("/testNames", (req, res)=> {
  res.render("testNames.ejs");
});

app.get("/patient", (req, res)=> {
  mysqlConnection.query("SELECT * FROM patient WHERE pid='" + userName + "'", (err, rows, fields) => {
    if (!err) {
      res.render("patient", {patientName: userName, info: rows});
    } else {
      console.log(err);
    }
  });
});

app.get("/patient_prescriptions", (req, res) => {
  mysqlConnection.query("SELECT * FROM prescriptions WHERE pid LIKE '" + userName + "'", (err, rows, fields) => {
    if (!err) {
      res.render("patient_prescriptions", {columns: fields,tuple: rows,patientName: userName});
    }
    else {
      console.log(err);
    }
  });
});

app.get("/patient_testReports", (req,res)=>{
  mysqlConnection.query("SELECT * FROM testreports WHERE pid='"+userName+"'",(err,rows,fields)=>{
    if (!err){
      res.render("patient_testReports",{columns: fields, tuple: rows, patientName: userName});
    }
    else {
      console.log(err);
    }
  });
});

app.get("/patient_appointments", (req,res)=>{
  mysqlConnection.query("SELECT appdate,apptime,docid FROM appointments WHERE pid='"+userName+"'",(err,rows,fields)=>{
    if (!err){
      res.render("patient_appointments", {patientName: userName, tuple:rows, columns: fields});
    }
    else {
      console.log(err);
      res.render("sql_errors",{error:err});
    }
  });
});

app.get("/patient_bill", (req,res)=>{
  var testDetails = {};
  var price = 0;
  mysqlConnection.query("SELECT pricedetails.price, testreports.testname FROM pricedetails INNER JOIN testreports ON pricedetails.testname=testreports.testname where testreports.pid='"+userName+"'", (err,rows,fields)=>{
    if (!err){
      testDetails = rows;
      mysqlConnection.query("select sum(priceDetails.price) as total from priceDetails INNER JOIN testreports on priceDetails.testname=testreports.testname where testreports.pid='"+ userName +"'",(err,rows,fields)=>{
        if (!err){
          price = rows[0].total;
          res.render("patient_bill",{relation: testDetails, amount: price, patientName: userName});
        }
        else {
          console.log(" couldn't compute your price");
        }
      });
    }
    else {
      console.log("operation couldn't be completed at the moment");
    }
  });
});

app.get("/doctor", (req, res)=> {
  mysqlConnection.query("SELECT docname,specialization,docemail FROM doctor WHERE docid='"+userName+"'",(err,rows,fields)=>{
    if (!err){
      res.render("doctor", {doctorName: userName, info: rows[0]});
    }
    else {
      console.log(err);
    }
  });
});

app.get("/doctor_appointments", (req, res)=> {
  mysqlConnection.query("SELECT appdate,apptime,pid FROM appointments WHERE docid='"+userName+"'",(err,rows,fields)=>{
    if (!err){
      res.render("doctor_appointments", {doctorName: userName, tuple:rows, columns: fields});
    }
    else {
      console.log(err);
    }
  });
});

app.get("/doctor_testReports", (req,res)=>{
  mysqlConnection.query("SELECT rep_no,testname,diagnosis,pid,adminid FROM testreports WHERE docid='"+userName+"'",(err,rows,fields)=>{
    if (!err){
      res.render("doctor_testReports",{doctorName: userName, tuple:rows, columns: fields});
    }
    else {
      console.log(err);
    }
  });
});

app.get("/doctor_prescriptions", (req,res)=>{
  mysqlConnection.query("SELECT * FROM prescriptions WHERE docid='"+userName+"'",(err,rows,fields)=>{
    if (!err){
      res.render("doctor_prescriptions", {doctorName: userName, tuple:rows, columns: fields});
    }
    else {
      console.log(err);
    }
  });
});

app.get("/doctor_addPrescriptions", (req,res)=>{
  var patients = {}
  mysqlConnection.query("SELECT pid FROM patient", (err,rows,fields)=>{
    if (!err){
      patients = rows;
      mysqlConnection.query("SELECT adminid FROM adminstaff",(err,rows,fields)=>{
        if (!err){
          res.render("doctor_addPrescriptions.ejs",{options: rows, options2:patients});
        }
        else {
          console.log(err);
        }
      });
    }
    else {
      console.log(err);
    }
  });
});

app.get("/admin", (req,res)=>{
  mysqlConnection.query("SELECT adminname, job, adminemail FROM adminstaff WHERE adminid='"+userName+"'",(err,rows,fields)=>{
    if (!err){
      res.render("admin", {adminName: userName, info: rows[0]});
    }
    else {
      console.log(err);
    }
  });
});

app.get("/admin_prescriptions", (req,res)=>{
  mysqlConnection.query("SELECT * FROM prescriptions WHERE adminid='"+userName+"'",(err,rows,fields)=>{
    if (!err){
      res.render("admin_prescriptions", {adminName: userName, tuple:rows, columns: fields});
    }
    else {
      console.log(err);
    }
  });
});

app.get("/admin_addPrescriptions", (req,res)=>{
  var doctorList = {};
  mysqlConnection.query("SELECT docid FROM doctor",(err,rows,fields)=>{
    if (!err){
      doctorList = rows;
      mysqlConnection.query("SELECT pid FROM patient", (err,rows,fields)=>{
        if (!err){
          res.render("admin_addPrescriptions",{patients: rows, doctors: doctorList});
        }
        else {
          console.log(err);
        }
      });
    }
    else {
      console.log(err);
    }
  });
});

app.get("/admin_appointments", (req,res)=>{
  mysqlConnection.query("SELECT * FROM appointments",(err,rows,fields)=>{
    if (!err){
      res.render("admin_appointments", {adminName: userName, tuple:rows, columns: fields});
    }
    else {
      console.log(err);
    }
  });
});

app.get("/admin_addAppointments", (req,res)=>{
  var doctorList = {};
  mysqlConnection.query("SELECT docid FROM doctor", (err,rows,fields)=>{
    if (!err){
      doctorList = rows;
      mysqlConnection.query("SELECT pid FROM patient", (err,rows,fields)=>{
        if (!err){
          res.render("admin_addAppointments",{patients: rows, doctors: doctorList});
        }
      });
    }
    else {
      console.log(err);
    }
  });
});

app.get("/admin_cancelAppointments", (req,res)=>{
  var patientList = {};
  mysqlConnection.query("SELECT pid FROM patient", (err,rows,fields)=>{
    if (!err) {
      patientList = rows;
      mysqlConnection.query("SELECT appdate FROM appointments", (err,rows,fields)=>{
        if (!err) {
          res.render("admin_cancelAppointments",{patients:patientList, dates:rows});
        }
        else {
          console.log(err);
        }
      });
    }
    else {
      console.log(err);
    }
  });
});

app.get("/admin_testReports", (req,res)=>{
  mysqlConnection.query("SELECT rep_no, testname, diagnosis, pid, docid FROM testreports WHERE adminid='"+userName+"'",(err,rows,fields)=>{
    if (!err){
      res.render("admin_testReports",{adminName: userName, tuple:rows, columns: fields});
    }
    else {
      console.log(err);
    }
  });
});

app.get("/admin_addTestReport", (req,res)=>{
  var patientList = {};
  var doctorList = {};
  mysqlConnection.query("SELECT pid FROM patient", (err,rows,fields)=>{
    if (!err){
      patientList = rows;
      mysqlConnection.query("SELECT docid FROM doctor", (err,rows,fields)=>{
        if (!err){
          doctorList = rows;
          mysqlConnection.query("SELECT testname FROM pricedetails", (err,rows,fields)=>{
            if (!err){
              res.render("admin_addTestReport.ejs",{patients: patientList, doctors: doctorList, tests: rows});
            }
            else {
              console.log(err);
            }
          });
        }
        else {
          console.log(err);
        }
      });
    }
    else {
      console.log(err);
    }
  });
});

/*----------------------------------------------------------------------------*/

//POST ROUTES

app.post("/login", (req, res)=> {
  var userType = req.body.user;
  userName = req.body.username;
  password = req.body.password;
  if (userType === "doctor") {
    mysqlConnection.query("SELECT docpass FROM doctor WHERE docid='"+userName+"'",(err,rows,fields)=>{
      if (!err && rows.length!=0){
        if (rows[0].docpass===password){
          mysqlConnection.query("SELECT docname,specialization,docemail FROM doctor WHERE docid='"+userName+"'",(err,rows,fields)=>{
            if (!err){
              res.render("doctor", {doctorName: userName, info: rows[0]});
            }
            else {
              console.log("password is correct but there was an error generating the table /n"+err);
              res.redirect("login");
            }
          });
        }
        else {
          console.log("incorrect password"+err);
          res.render("error");
        }
      }
      else {
        console.log("either doctor doesn't exist or there was an error"+err);
        res.render("error");
      }
    });
  }
  else if (userType === "patient") {
    mysqlConnection.query("SELECT ppass FROM patient WHERE pid='"+userName+"'",(err,rows,fields)=>{
      if (!err && rows.length!=0){
        if (rows[0].ppass===password){
          mysqlConnection.query("SELECT * FROM patient WHERE pid='" + userName + "'", (err, rows, fields) => {
            if (!err) {
              res.render("patient", {patientName: userName, info: rows});
            } else {
              console.log("password is correct but there was an error generating the table /n"+err);
              res.redirect("login");
            }
          });//connection close
        }
        else {
          console.log("incorrect password");
          res.render("error");
        }
      }
      else {
        console.log("either patient doesn't exist or there was an error"+err);
        res.render("error");
      }
    });
  }
  else if (userType === "admin") {
    mysqlConnection.query("SELECT adminpass FROM adminstaff WHERE adminid='"+userName+"'",(err,rows,fields)=>{
      if (!err && rows.length!=0){
        if (rows[0].adminpass===password){
          mysqlConnection.query("SELECT adminname, job, adminemail FROM adminstaff WHERE adminid='"+userName+"'",(err,rows,fields)=>{
            if (!err){
              res.render("admin", {adminName: userName, info: rows[0]});
            }
            else {
              console.log(err);
            }
          });
        }
        else {
          console.log("incorrect password");
          res.render("error");
        }
      }
      else {
        console.log("either admin doesn't exist or an error occured"+err);
        res.render("error");
      }
    });
  }
  else {
    console.log("hit the console log");
  }
});

app.post("/doctor_prescriptions",(req,res)=>{
  var presNumber = req.body.pres_no;
  var medicine = req.body.medname;
  var patID = req.body.pid;
  var adminID = req.body.adminid;
  mysqlConnection.query("INSERT INTO prescriptions values("+presNumber+",'"+medicine+"','"+userName+"','"+patID+"','"+adminID+"')",(err)=>{
    if (!err){
      mysqlConnection.query("SELECT * FROM prescriptions WHERE docid='"+userName+"'",(err,rows,fields)=>{
        if (!err){
          res.render("doctor_prescriptions", {doctorName: userName, tuple:rows, columns: fields});
        }
        else {
          console.log(err);
        }
      });
    }
    else {
      console.log(err);
      res.render("sql_errors.ejs",{error: err});
    }
  });

});

app.post("/success", (req, res)=> {
  var name = req.body.fname;
  var patID = req.body.uname;
  userName = patID;
  var p1 = req.body.pass1;
  var age = req.body.age;
  var gender = req.body.gender;
  var phno = req.body.phoneNumber;
  var pemail = req.body.email;
  var address = req.body.address;
  var houseNo = address.split(" ")[0];
  var parea = address.split(" ");
  parea = parea.slice(1);
  var state = req.body.state;
  var city = req.body.city;
  var pin = req.body.pincode;
  mysqlConnection.query("INSERT INTO patient VALUES('"+patID+"','"+p1+"','"+name+"','"+gender+"','"+age+"',"+houseNo+",'"+parea+"','"+city+"','"+pin+"','"+state+"',"+phno+",'"+pemail+"')",(err)=>{
    if (!err){
      res.render("success",{patientName: userName});
    }
    else {
      console.log(err);
      res.render("sql_errors.ejs",{error: err});
    }
  });
});

app.post("/admin_addPrescriptions", (req,res)=>{
  var presNumber = req.body.pres_no;
  var medicine = req.body.medname;
  var docID = req.body.docid;
  var patID = req.body.pid;
  mysqlConnection.query("INSERT INTO prescriptions values("+presNumber+",'"+medicine+"','"+docID+"','"+patID+"','"+userName+"')",(err)=>{
    if (!err){
      mysqlConnection.query("SELECT * FROM prescriptions WHERE adminid='"+userName+"'",(err,rows,fields)=>{
        if (!err){
          res.render("admin_prescriptions", {adminName: userName, tuple:rows, columns: fields});
        }
        else {
          console.log(err);
        }
      });
    }
    else {
      console.log(err);
      res.render("sql_errors.ejs",{error: err});
    }
  });
});

app.post("/admin_Appointments", (req,res)=>{
  var date = req.body.appdate;
  var time = req.body.apptime;
  var docID = req.body.docid;
  var patID = req.body.pid;
  mysqlConnection.query("INSERT INTO appointments VALUES('"+date+"','"+time+"','"+docID+"','"+patID+"')",(err)=>{
    if (!err){
      mysqlConnection.query("SELECT * FROM appointments",(err,rows,fields)=>{
        if (!err){
          res.render("admin_appointments", {adminName: userName, tuple:rows, columns: fields});
        }
        else {
          console.log(err);
        }
      });
    }
    else {
      console.log(err);
      res.render("sql_errors.ejs",{error: err});
    }
  });
});

app.post("/admin_cancelAppointments", (req,res)=>{
  var date = req.body.appdate;
  var patID = req.body.pid;
  mysqlConnection.query("DELETE FROM appointments WHERE (appdate='"+date+"') AND (pid='"+patID+"')",(err)=>{
    if (!err){
      mysqlConnection.query("SELECT * FROM appointments",(err,rows,fields)=>{
        if (!err){
          res.render("admin_appointments", {adminName: userName, tuple:rows, columns: fields});
        }
        else {
          console.log("Couldn't delete record"+err);
        }
      });
    }
    else {
      console.log(err);
      res.render("sql_errors.ejs",{error: err});
    }
  });
});

app.post("/admin_testReports", (req,res)=>{
  var reportNumber = req.body.rep_no;
  var testName = req.body.testname;
  var diagnosis = req.body.diagnosis;
  var docID = req.body.docid;
  var patID = req.body.pid;
  var patientList = {};
  var doctorList = {};
  mysqlConnection.query("INSERT INTO testreports VALUES("+reportNumber+",'"+testName+"','"+diagnosis+"','"+docID+"','"+patID+"','"+userName+"')",(err)=>{
    if (!err){
      mysqlConnection.query("SELECT rep_no, testname, diagnosis, pid, docid FROM testreports WHERE adminid='"+userName+"'",(err,rows,fields)=>{
        if (!err){
          res.render("admin_testReports",{adminName: userName, tuple:rows, columns: fields});
        }
        else {
          console.log(err);
        }
      });
    }
    else {
      console.log(err);
      res.render("sql_errors.ejs",{error: err});
    }
  });
});

app.listen(3000, ()=> {
  console.log("Server is up and running on port 3000!");
});
