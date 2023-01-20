/*********************************
	Live Your Life
	Поиск партнёра для игры
	Версия: V0.0.1
	Автор: Leraje
	Дата: 18.01.2022
	Последние изменения: 18.01.2022
*********************************/

var topicIds = [32934, 32932, 32936, 32937, 32930, 36254, 32931, 45726];
var currentUrl = window.location.href;
var domain = currentUrl.substring(0, currentUrl.indexOf("/viewtopic.php"));
var currentDate = new Date();
var twoMonthsAgo = new Date();
twoMonthsAgo.setMonth(currentDate.getMonth() - 2);

function checkCurrentPage() {
	for (var i = 0; i < topicIds.length; i++) {
		if (currentUrl.includes("id=" + topicIds[i])) {
			getPostsWithUsernamesAndMessageInfo(topicIds[i]);
			break;
		}
	}
}

function getPostsWithUsernamesAndMessageInfo(topicId) {
	$.post(
		"/api.php",
		{
			method: "post.get",
			topic_id: topicId,
			fields: "user_id,username,id,posted",
			limit: 100
		},
		function(response) {
			if (response.response) {
				var userIds = countUserIds(response.response);
				var sameUserMessages = createSameUserMessages(response.response, userIds);
				var olderMessages = getOlderMessages(response.response);
				var spoilerMessages = getSpoilerMessages(sameUserMessages);
				var oldAndSameMessages = getOldAndSameMessages(spoilerMessages, olderMessages);
				var sameMessages = processSameUserMessages(sameUserMessages);
				
				// Tests
				//console.log("Users id and count posts (for information): ", userIds);
				//console.log("Messages from the same user (for information): ", sameUserMessages);
				//console.log("Older messages: ", olderMessages);
				//console.log("Spoilered messages: ", spoilerMessages);
				//console.log("Old and same messages: ", oldAndSameMessages);
				//console.log("Messages from the same user repeat early two weeks (for information): ", sameMessages);
				
				hidePostsInSpoilers(spoilerMessages, olderMessages, oldAndSameMessages, sameMessages);
			} }
	);
	
}

function countUserIds(messages) {
    var userIds = {};
    for (var i = 1; i < messages.length; i++) {
        var message = messages[i];
        if (!userIds[message.user_id]) {
            userIds[message.user_id] = {
                count: 1,
                postIds: [message.id]
			};
			} else {
            userIds[message.user_id].count++;
            userIds[message.user_id].postIds.push(message.id);
		}
	}
    return userIds;
}

function createSameUserMessages(messages, userIds) {
    var sameUserMessages = {};
    for (var i = 1; i < messages.length; i++) {
        var message = messages[i];
        if (userIds[message.user_id].count > 1) {
            if (sameUserMessages[message.user_id]) {
                sameUserMessages[message.user_id].posts.push({
                    id: message.id,
                    posted: message.posted
				});
				} else {
                sameUserMessages[message.user_id] = {
                    username: message.username,
                    posts: [{
                        id: message.id,
                        posted: message.posted
					}]
				};
			}
		}
	}
    return sameUserMessages;
}

function getOlderMessages(messages) {
    var olderMessages = [];
    for (var i = 1; i < messages.length; i++) {
        var message = messages[i];
        var messageDate = new Date(message.posted * 1000);
        if (messageDate < twoMonthsAgo) {
            olderMessages.push(message.id);
		}
	}
    return olderMessages;
}

function getSpoilerMessages(sameUserMessages) {
    var spoilerMessages = [];
    for (var userId in sameUserMessages) {
        var user = sameUserMessages[userId];
        for (var i = 0; i < user.posts.length - 1; i++) {
            var post = user.posts[i];
            var postDate = new Date(post.posted * 1000);
            spoilerMessages.push({
                id: post.id,
                username: user.username,
                posted: postDate
			});
		}
	}
    return spoilerMessages;
}

function getOldAndSameMessages(spoilerMessages, olderMessages) {
    var oldAndSameMessages = [];
    for (var i = 0; i < spoilerMessages.length; i++) {
        var message = spoilerMessages[i];
        if (olderMessages.includes(message.id)) {
            oldAndSameMessages.push(message.id);
            var index = olderMessages.indexOf(message.id);
            olderMessages.splice(index, 1);
            spoilerMessages.splice(i, 1);
            i--;
		}
	}
    return oldAndSameMessages;
}

function hidePostsInSpoilers(spoilerMessages, olderMessages, oldAndSameMessages, sameMessages) {
    var posts = document.getElementsByClassName("post-content");
    for (var i = 0; i < posts.length; i++) {
        var postId = posts[i].id.substring(1, posts[i].id.indexOf("-content")) || posts[i].parentNode.parentNode.parentNode.parentNode.id.substring(1);
        if (spoilerMessages.find(post => post.id == postId)) {
            addSpoiler(posts[i], "Пользователь оставил новую заявку в этой теме.");
			} else if (olderMessages.includes(postId)) {
            addSpoiler(posts[i], "Заявка старше 2-х месяцев, возможно, она более не актуальна.");
			} else if (oldAndSameMessages.includes(postId)) {
            addSpoiler(posts[i], "Заявка старше 2-х месяцев, и от данного пользователя существует новая.");
			} else if (sameMessages[postId] && GroupID <= 2) {
            var prevPostId = sameMessages[postId].idPost;
            var prevPostDate = sameMessages[postId].posted;
            var message = "<span style='color:red;'>Заявка опубликована ранее 2-х недель после предыдущей!</span> <a href='"+domain+'/viewtopic.php?pid='+prevPostId+'#p'+prevPostId+"'>Предыдущая заявка (Опубликована: "+prevPostDate+")</a>";
            addSpoiler(posts[i], message);
		}
	}
}

function addSpoiler(post, title) {
	var spoilerHTML = '<div class="quote-box spoiler-box media-box"><div onclick="toggleSpoiler(this);" id="spoiler0" class="">' + title + '<a name="220_0" style="position:absolute;margin-top:-200px"></a></div><blockquote class="">' + post.innerHTML + '</blockquote></div>';
	post.innerHTML = spoilerHTML;
}

function processSameUserMessages(sameUserMessages) {
    var sameMessages = {};
    for (var userId in sameUserMessages) {
        var user = sameUserMessages[userId];
        for (var i = 1; i < user.posts.length; i++) {
            var currentPost = user.posts[i];
            var prevPost = user.posts[i - 1];
            var currentPostDate = new Date(currentPost.posted * 1000);
            var prevPostDate = new Date(prevPost.posted * 1000);
            var timeDiff = currentPostDate - prevPostDate;
            var twoWeeks = 13 * 24 * 60 * 60 * 1000;
            if (timeDiff < twoWeeks) {
                sameMessages[currentPost.id] = {
                    idPost: prevPost.id,
                    posted: prevPostDate.toLocaleDateString()
				};
			}
		}
	}
    return sameMessages;
}

checkCurrentPage();