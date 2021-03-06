function loadSkills(skills){
		var i=0,j;
		var skillsInnerHTML='';
		while(i<skills.length){

			var row = '<div class="row">';
			for(j=i;j<i+6&&j<skills.length;j++){
				var skill = '<div class="col m2"><svg viewBox="0 0 128 128"><path d="'+skills[j].icon+'"></path></svg>'+skills[j].name+'</div>';
				row+=skill;
				
			}
			row+='</div>';
			skillsInnerHTML+=row;
			
			i=j;
		}
		$('#skills').html(skillsInnerHTML);
}

function loadProjects(projects){
	projects.sort(function(a,b){
		return a.sn-b.sn;
	});
	var i=0,j;
	var projectsInnerHTML='';
	for(i=0;i<projects.length;i++){					
		project = ' <div class="row project"><div class="col m6 s12"><div class="row"><span class="title">'+projects[i].projectTitle+'</span><hr></div><div class="row"><span>'+projects[i].periodStart+'-'+projects[i].periodEnd+'</span></div>';
		toolsUsed = '<div class="row">Tools Used: ';
		for(j=0;j<projects[i].toolsUsed.length;j++){
			toolsUsed+='<span>'+projects[i].toolsUsed[j]+'</span>';
		}
		toolsUsed+='</div>';
		project+=toolsUsed;
		tags = '<div class=row">'
		for(j=0;j<projects[i].tags.length;j++)tags+='<span class="tag">#'+projects[i].tags[j]+'</span>&nbsp';
		if(projects[i].link!="#") tags+='<a href="'+projects[i].link+'" target="_blank"><i class="material-icons right">language</i></a>';
		tags+='</div>';
		project+=tags;
		project+='</div><div class="col m6 s12 details">'+projects[i].shortInfo+'</div></div>';
		projectsInnerHTML+=project;
	}
	$('#projects').html(projectsInnerHTML);
}

function loadWorks(experince){
	experince.sort(function(a,b){
		return a.sn-b.sn;
	});
	var i;
	var works = experince.filter((experince)=>experince.type=="work");
	var worksInnerHTML = '';
	for(i=0;i<works.length;i++){
		worksInnerHTML+=`
		<div class="row work">
			<div class="row title">
				<a href="${works[i].link}">${works[i].organisation}</a> |
				${works[i].workPosition} |
				${works[i].periodStart} - ${works[i].periodEnd}
			</div>
			<hr/>
			<div class="row details">
				${works[i].experience}
			</div>
		</div>`;
	}
	$('#experience').html(worksInnerHTML);
}

function loadEducations(educations){
	var i=0,j;
	var educationsInnerHTML = '';
	for(i=0;i<educations.length;i++){
		education = '<div class="row education"><div class="col m6 s12">					<div class="row title">'+educations[i].course+'<hr></div><div class="row">'+educations[i].periodStart+'-'+educations[i].periodEnd+'</div><div class="row">'+educations[i].inst+'</div><div class="row">'+educations[i].board+'</div></div><div class="col m6 s12 details"><ul class="collapsible" data-collapsible="accordion"><li><div class="collapsible-body">';
		var courses = educations[i].courses;
		courses.sort(function(a,b){
			return a.sn-b.sn;
		});
		var coursesInnerHTML = '';
		for(j=0;j<courses.length;j++){
				coursesInnerHTML+='<div class="row"><div class="col m2 s2">'+courses[j].courseCode+'</div><div class="col m8 s8">'+courses[j].courseName+'</div><div class="col m2 s2">'+courses[j].courseScore+'</div></div>';
		}
		education+=coursesInnerHTML;
		education +='</div></li></ul></div></div>';
		educationsInnerHTML+=education;
	}
	$('#education').html(educationsInnerHTML);
}

function loadLinks(profileLinks){
	var i=0,j;			
	profileLinks.sort(function(a,b){
		return a.sn-b.sn;
	});
	var profileLinksInnerHTML = '';
	while(i<profileLinks.length){
		profileLinksInnerHTML+='<div class="row">'
		for(j=i;j<profileLinks.length&&j<i+5;j++){
			profileLinksInnerHTML+='<div class="col s2">													<a href="'+profileLinks[j].link+'" target="_blank" >					<img src="img/'+profileLinks[j].icon+'" alt="'+profileLinks[j].name+'">															</a></div>';
		}
		profileLinksInnerHTML+='</div>';
		i=j;
	}
	$('#links').html(profileLinksInnerHTML);
}

function loadLikes(likes){
	likes = likes.sort(function(a,b){
		return a.sn-b.sn;
	});
	var i;
	var likesInnerHTML = '<h4>I like</h4>';
	for(i=0;i<likes.length;i++){
		likesInnerHTML+='<object type="image/svg+xml" data="img/'+likes[i].icon+'">'+likes[i].name+'</object>'
	}
	$('#likes').html(likesInnerHTML);
}

function loadBlog() {
	var blogHtml = `<div class='sk-ww-medium-publication-feed' data-embed-id='26322'></div><script src='https://www.sociablekit.com/app/embed/medium-publication-feed/widget.js'></script>`;
	$('#blog').html(blogHtml);	
}

function onBodyLoad(){
	$('div.progress').css('display','none');
	$('div.content').css('display','block');
	$('.collapsible').collapsible({
		'accordion' : true
	});
	$('#tabs').tabs({ 'swipeable': true });
	onWindowResize();
}

function onWindowResize(){
	const heightPageA = parseInt($('#pagea').css('height').replace('px',''),10);
	const tabContentHeight = Math.max(heightPageA-48,(window.innerHeight - 50)) + 'px';
	const tabs = document.getElementsByClassName('tabs-content carousel initialized');
	if (tabs && tabs[0]) {
		tabs[0].style.height = tabContentHeight;
	}
	$('#skills div.m2').css('height',$('#skills div.m2').css('width'));
	$('#image img').css('height',$('#image img').css('width'));
}


$(window).resize(onWindowResize);

var profile;
//.then((value)=>{
// 	if(value===true) {
// 		swal({
// 			title: "Hello Talent Scout,",
// 			text: "Thank you for visiting my webspace. I hope you'll find relevant information here. If you need any other information, kindly reach to me. \n\n Do you need a copy of my resume?",
// 			buttons: {
// 				cancel: {
// 				  text: "I have your resume.",
// 				  value: false,
// 				  visible: true,
// 				  className: "button-cancel",
// 				  closeModal: true,
// 				},
// 				confirm: {
// 				  text: "Yes, sure.",
// 				  value: true,
// 				  visible: true,
// 				  className: "button-confirm",
// 				  closeModal: true
// 				}
// 			}
// 		}).then((value)=>{
// 			if(value===true) { 
// 				window.open('/Resume_Shubham_Sawant.pdf');
// 			}
// 		})
// 	}
// });

$.get("js/profile.json", 
	function(data, status){
		if(status!=="success") {
			window.location.href = "/error.html";
		}
		profile = data;
		var pInfo = profile.personalInfo;
		$('#name').html(pInfo.fname+' '+pInfo.lname);
		$('#image img').attr('src','img/'+pInfo.myimg);
		$('#contact').html(pInfo.mob+'</br>'+pInfo.email);
		$('#summary').html(profile.summary);
		$('#tabs').html(`					
			<li class="tab col s3"><a href="#skills">Skills</a></li>
			<li class="tab col s3"><a href="#projects">Projects</a></li>
			<li class="tab col s3"><a href="#experience">Experience</a></li>
			<li class="tab col s3"><a href="#education">Education</a></li>
		`);
		loadLikes(profile.likes);
		loadLinks(profile.profileLinks);
		loadSkills(profile.skills);
		loadProjects(profile.projects);
		loadWorks(profile.experince);
		loadEducations(profile.educations);
		onBodyLoad();
});