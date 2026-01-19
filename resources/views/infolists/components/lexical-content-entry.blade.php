<x-dynamic-component
    :component="$getEntryWrapperView()"
    :entry="$entry"
>
    <div {{ $attributes->merge($getExtraAttributes())->class(['lexical-content']) }}>
        {!! $getState() !!}
    </div>
</x-dynamic-component>

@once('lexical-social-embeds')
<script>
    // Load Twitter widgets for embedded tweets (Lexical Editor Package)
    (function() {
        function loadTwitterWidgets() {
            // Find tweet wrappers with data-tweet-id attribute
            var tweetWrappers = document.querySelectorAll('.lexical-tweet-wrapper[data-tweet-id]');
            if (tweetWrappers.length === 0) return;

            function renderTweets() {
                tweetWrappers.forEach(function(wrapper) {
                    // Skip if already processed
                    if (wrapper.dataset.tweetRendered === 'true') return;

                    var tweetId = wrapper.getAttribute('data-tweet-id');
                    var container = wrapper.querySelector('.lexical-tweet-container');
                    if (!tweetId || !container) return;

                    // Mark as being processed
                    wrapper.dataset.tweetRendered = 'true';

                    // Clear container and use Twitter's createTweet API
                    container.innerHTML = '';
                    window.twttr.widgets.createTweet(tweetId, container, {
                        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
                        align: wrapper.getAttribute('data-tweet-alignment') || 'center'
                    });
                });
            }

            if (!document.getElementById('twitter-wjs')) {
                var js = document.createElement('script');
                js.id = 'twitter-wjs';
                js.src = 'https://platform.twitter.com/widgets.js';
                js.async = true;
                js.onload = function() {
                    if (window.twttr && window.twttr.widgets) {
                        renderTweets();
                    }
                };
                document.body.appendChild(js);
            } else if (window.twttr && window.twttr.widgets) {
                renderTweets();
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadTwitterWidgets);
        } else {
            loadTwitterWidgets();
        }

        document.addEventListener('livewire:navigated', loadTwitterWidgets);
    })();
</script>
@endonce
