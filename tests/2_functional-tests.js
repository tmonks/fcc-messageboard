/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    let thread_id;
    const delete_password = 'Password123';
    
    suite('POST', function() {
      test('POST new thread', done => {
        chai.request(server)
          .post('/api/threads/testing')
          .send({ text: 'test thread', delete_password })
          .end((err, res) => {
            assert.equal(res.status, 200);
            done();
          });
      });
    });
    
    suite('GET', function() {
      test('GET list of threads', done => {
        chai.request(server)
          .get('/api/threads/testing')
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body, 'An array is returned');
            assert.isAtLeast(res.body.length, 1, 'At least one thread is returned');
            assert.isAtMost(res.body.length, 10, 'At most 10 threads are returned');
            assert.property(res.body[0], '_id', 'Threads have _id property');
            assert.property(res.body[0], 'text', 'Threads have text property');
            assert.property(res.body[0], 'created_on', 'Threads have created_on property');
            assert.property(res.body[0], 'bumped_on', 'Threads have bumped_on property');
            assert.notProperty(res.body[0], 'delete_password', 'delete_password property is hidden');
            assert.notProperty(res.body[0], 'reported', 'reported property is hidden');
            thread_id = res.body[0]._id;
            done();
          });
      })
    });
    
    suite('DELETE', function() {
      test('DELETE thread with wrong password', done => {
        chai.request(server)
          .delete('/api/threads/testing')
          .send({ thread_id, delete_password: "wrongpassword" })
          .end((err, res) => {
            assert.equal(res.status, 403);
            assert.equal(res.text, 'incorrect password');
            done();
          });
      });
      
      test('DELETE thread with correct password', done => {
        chai.request(server)
          .delete('/api/threads/testing')
          .send({ thread_id, delete_password })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
      });
    });
    
    suite('PUT', function() {
      
    });
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      
    });
    
    suite('GET', function() {
      
    });
    
    suite('PUT', function() {
      
    });
    
    suite('DELETE', function() {
      
    });
    
  });

});
