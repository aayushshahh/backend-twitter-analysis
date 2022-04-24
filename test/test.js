const express = require('express');
const chai = require('chai');
const request = require('supertest');

const app = express();

describe('POST get tweets',() => {
    it('should get tweets and expect a response', () => {
        request(app)
        .post('/getTweets')
        .send('@jack')
        .expect(400)
    });
    it('should throw an error for invalid username', () =>{

    });
});

describe('POST sign-up',() => {
    it('Logging successful', () => {
        request(app)
        .post('/signup')
        .send({})
        .expect("Logging Successful")
        .then((res) => {
            expect(res.headers.location).to.be.eql('/signup');
        });
        
    });
    it('error in mongoDB', () =>{
        request(app)
        .post('/signup')
        .send({})
        .expect(500)
        .then((res) => {
            expect(res.headers.location).to.be.eql('/signup');
        });
    });
    it('error in input data', () =>{
        request(app)
        .post('/signup')
        .send({})
        .expect("Error in input data")
        .then((res) => {
            expect(res.headers.location).to.be.eql('/signup');
        });
    });
});

describe('login', () => {

});

describe('add History',() => {

});

describe('get History', () =>
{
    it('get a response', () => {
        request(app)
        .post('/getHistory')
        .send({})
        .expect("Successful")
        .then((res) => {
            expect(res.headers.location).to.be.eql('');
        });
    });
    it('get an error', () =>{
        request(app)
        .post('/getHistory')
        .send({})
        .expect("Failure")
        .then((res) => {
            expect(res.headers.location).to.be.eql('');
        });
    });
});