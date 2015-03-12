## What It Is ##

dsHistory is a small, cross-browser JavaScript library that can be used in web applications to handle the browser's back and forward button events. As the back and forward events are raised, functions that the developer had previously pushed onto the internal function stack within the library are executed.

Take a look at the [demo](http://dshistory.googlecode.com/svn/trunk/examples/demo.html). I encourage you to check out [what makes it different](WhatMakesItDifferent.md) from other browser history managers.

## Is It Stable? ##

dsHistory is currently in beta and has not yet reached version 1.0. The first release occurred in April of 2007. That said, the code is functioning in production without problems on a number of different sites.

It should be noted that, in the case of all browser history managers, the term "stable" is used loosely. Browser history managers are based on a number of different oddities (euphemism for hacks) in each browser. Even though dsHistory only supports four different browsers, the number of complexities are already very high, and thus even the most basic functionality takes a great deal of effort to achieve. Increased complexity is always directly proportional to increased failure.

## Where (Else) Can I Get Help? ##

If you've already ready the [Usage](Usage.md) wiki and you've taken a look at the [Examples](Examples.md) wiki, you can post in the [dsHistory-discuss Google Group](http://groups.google.com/group/dsHistory-discuss). If you still can't figure it out, I'm more than happy to help where and when I can. You can email me at amattie-attt-gmail-dottt-com.

## Getting Updates ##

I'll be posting information about major releases on [my blog](http://www.akmattie.net/blog). I'll post new downloads and other project-specific updates on the [dsHistory Project Updates blog](http://dshistory.googlecode.com/svn/rss-update-feed.xml). Otherwise, you can check back here for updates.

## Current Browser Support ##

  * Firefox 2, 3 : **Yes**
  * Internet Explorer 6, 7 : **Yes**
  * Safari 2 : **No**
  * Safari 3 : **Yes**
  * Google Chrome : **Yes**
  * Opera : **No**