document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  //form submit
  document.querySelector('#compose-form').addEventListener('submit', sendmail);
  // By default, load the inbox
  load_mailbox('inbox');
});

//send mail in the page of compose_mail
function sendmail(event) {
  event.preventDefault(); // 停止瀏覽器預設重整 
  //取值
  const inputRecipients = document.getElementById('compose-recipients').value;
  const inputSubject = document.getElementById('compose-subject').value;
  const inputBody = document.getElementById('compose-body').value;
  //SEND & load to sent page
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: inputRecipients,
      subject: inputSubject,
      body: inputBody
    })
  })
    .then(response => response.json())
    .then(result => {
      // Print result
      console.log(result);
    });
  load_mailbox('sent');
}
function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}
function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //get mail arrays
  fetch(`/emails/${mailbox}`)  //connect server
    .then(response => response.json())  // 輸出成 json
    .then(emails => {
      //印出mail到inbox頁面
      emails.forEach(eachEmail => {
        const mailDiv = document.createElement("div"); //create new Div element
        const archiveButton = document.createElement("button"); //create new button element
        const unArchiveButton = document.createElement("button"); //create new button element
        const br = document.createElement("br"); //分隔線

        mailDiv.innerHTML = `
                          <strong>${eachEmail.sender}</strong>
                           ${eachEmail.subject} 
                           <span class="timestamp">${eachEmail.timestamp}</span>`;   //insert content to html
        archiveButton.innerHTML = "Archive";
        unArchiveButton.innerHTML = "UnArchive"
        mailDiv.setAttribute("class", "time");
        archiveButton.setAttribute("class", "btn btn-dark");
        unArchiveButton.setAttribute("class", "btn btn-warning");

        if (mailbox == "inbox") {
          //只有inbox 頁面可點擊信見內容
          mailDiv.addEventListener('click', () => load_page(eachEmail.id));
          //為Unarchive時顯示 eachmail div & 增加Archivebutton
          if (eachEmail.archived == false) {
            document.getElementById('emails-view').append(mailDiv);
            document.getElementById('emails-view').append(archiveButton);
            document.getElementById('emails-view').append(br);
          }

          //如為已讀背景設定為灰色
          if (eachEmail.read == true) {
            //console.log("color");
            mailDiv.style.backgroundColor = "gainsboro";
          }
        } else if (mailbox == "archive") {
          // archive page
          if (eachEmail.archived == true) {
            document.getElementById('emails-view').append(mailDiv);
            document.getElementById('emails-view').append(unArchiveButton);
            document.getElementById('emails-view').append(br);
          }
        } else {
          //sent page;
          document.getElementById('emails-view').append(mailDiv);
          document.getElementById('emails-view').append(br);
        }

        //unArchiveMail & archiveMail 事件
        unArchiveButton.addEventListener('click', () => unArchiveMail(eachEmail.id));
        archiveButton.addEventListener('click', () => archiveMail(eachEmail.id));
      });
    });
}
function load_page(email_id) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').innerHTML = ''; //清空
  // 標記 已讀 read
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
  //show id page
  fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      // Print email
      console.log(email);
      const maildiv = document.createElement("div"); //上半部
      const hr = document.createElement("hr"); //分隔線
      const maildcontent = document.createElement("div"); //下半部
      const reply = document.createElement("button"); // reply button
      reply.setAttribute("class", "btn btn-primary");
      reply.innerHTML = 'Reply';
      maildiv.innerHTML = `
                        <div><strong>From:</strong> ${email.sender}</div> 
                        <div><strong>To:</strong> ${email.recipients} </div>
                        <div><strong>Subject:</strong> ${email.subject} </div>
                        <div><strong>Timestamp:</strong> ${email.timestamp} </div>`;
      maildcontent.innerHTML = email.body;
      document.getElementById('emails-view').append(maildiv);
      document.getElementById('emails-view').append(reply);
      document.getElementById('emails-view').append(hr);
      document.getElementById('emails-view').append(maildcontent);

      //REPLY BUTTON 事件
      reply.addEventListener('click', () => replyMail(email));
    });
}
//封存mail
function archiveMail(email_id) {
  //標記為封存
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    })
  })
    //load inbox
    .then(email => {
      load_mailbox('inbox');
    });
}
//解除封存mail
function unArchiveMail(email_id) {
  //標記為沒封存
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  })
    //load inbox
    .then(email => {
      load_mailbox('inbox');
    });

}

//reply mail
function replyMail(email) {
  console.log(email.sender);
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#title').innerHTML = "Reply Email";

  // 預設內容
  document.querySelector('#compose-recipients').value = email.sender;
  // 如開頭為Re，不用再加Re
  if (email.subject.slice(0, 2) == "Re") {
    document.querySelector('#compose-subject').value = `${email.subject}`;
  } else {
    document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
  }
  //body預設
  document.querySelector('#compose-body').value = `\n----------------\n On${email.timestamp} ${email.sender} wrote:\n ${email.body}`;

  // sent mail
  document.querySelector('#compose-form').addEventListener('submit', sendmail);

}