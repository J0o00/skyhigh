/**
 * Services Index
 * 
 * Exports all intelligence services from a single entry point.
 */

const intentDetection = require('./intentDetection');
const potentialScoring = require('./potentialScoring');
const agentAssist = require('./agentAssist');
const recommendations = require('./recommendations');

module.exports = {
    ...intentDetection,
    ...potentialScoring,
    ...agentAssist,
    ...recommendations
};
