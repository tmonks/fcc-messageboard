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
    let thread_count;
    
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
            thread_count = res.body.length;
            console.log(thread_count + " threads found. Working with " + thread_id);
            done();
          });
      })
    });
    
    suite('PUT', function() {
      
      test('PUT to report a thread', done => {
        chai.request(server)
          .put('/api/threads/testing')
          .send({ thread_id })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
      });  
      
      // Realized this won't work since the 'reported' attribute is hidden
//       test('Reported thread is now marked reported', done => {
//         chai.request(server)
//           .get('/api/threads/testing')
//           .end((err, res) => {
//             assert.equal(res.status, 200);
//             assert.atLeast(res.body.length, 1, 'At least one thread was returned');
//             let indexOfThread = res.body.indexOf(x => x._id === thread_id);
//             assert.atLeast(indexOfThread, 0, 'Our thread is present');
//             assert.property(res.body[indexOfThread], 'reported' , 'Thread has the reported')
//           });
        
//       });
      
    }); // PUT suite
    
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
            assert.equal(res.text, 'success', "Response is 'success'");
            done();
          });
      });
      
      test('Deleted thread is gone', done => {
        chai.request(server)
          .get('/api/threads/testing')
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.body.length, thread_count - 1, 'There is now one less thread');
            if (res.body.length > 0) {
              // find the index of the thread with thread_id if it exists
              const indexOfThread = res.body.indexOf(x => x._id === thread_id);
              assert.equal(indexOfThread, -1, 'thread_id is not found in the returned array');
            }
            done();
          });
      });
      
    }); // DELETE suite
    

    

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
