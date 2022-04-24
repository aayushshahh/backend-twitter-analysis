const express = require('express');
const chai = require('chai');
const request = require('supertest');

describe('POST get tweets',() => {
    it('should get tweets and expect a response', () => {
        
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
    
});