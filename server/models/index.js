/**
 * Model Index
 * 
 * Exports all Mongoose models from a single entry point.
 */

const Customer = require('./Customer');
const Interaction = require('./Interaction');
const Agent = require('./Agent');
const Keyword = require('./Keyword');
const CallSummary = require('./CallSummary');

module.exports = {
    Customer,
    Interaction,
    Agent,
    Keyword,
    CallSummary
};
