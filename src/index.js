import {parser} from "./parser.js";

let expression = "var a = class b extends 1{}"

let parsed = parser(expression);

console.log(parsed)